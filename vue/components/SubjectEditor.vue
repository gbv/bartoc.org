<template>
  <div class="subject-editor">
    <!-- Show all selected subjects, independent from the active scheme -->
    <table
      v-if="subjects.length"
      class="table table-sm table-borderless selected-subjects">
      <tbody>
        <tr
          v-for="(subject, i) in subjects"
          :key="subjectKey(subject, i)">
          <!-- Scheme label, e.g. DDC / EUROVOC / ILC -->
          <td class="scheme-col">
            <item-name
              :item="findScheme(subject.inScheme?.[0]?.uri)"
              :notation="true"
              :pref-label="false" />
          </td>

          <!-- Selected concept -->
          <td class="subject-col">
            <div class="subject-box">
              <item-name
                :item="subject"
                :notation="true" />
            </div>
          </td>

          <!-- Reorder / remove buttons -->
          <td class="actions-col">
            <div class="btn-group">
              <button
                :disabled="!i"
                type="button"
                class="btn btn-outline-secondary"
                @click="up(i)">
                &#9650;
              </button>
              <button
                :disabled="i >= subjects.length - 1"
                type="button"
                class="btn btn-outline-secondary"
                @click="down(i)">
                &#9660;
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="remove(i)">
                &times;
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Single picker area: one dropdown + one ConceptSchemePicker -->
    <div class="subject-picker">
      <div class="picker-scheme">
        <select
          v-model="activeSchemeUri"
          class="form-control">
          <option
            v-for="s in indexingSchemes"
            :key="s.uri"
            :value="s.uri">
            {{ s.notation?.[0] || s.prefLabel?.en || s.uri }}
          </option>
        </select>
      </div>

      <div class="picker-main">
        <concept-scheme-picker
          :key="activeSchemeUri"
          v-model="activeSubjects"
          :provider="activeProvider"
          :show-selected="false"
          placeholder="Search or browse…" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue"
import ConceptSchemePicker from "./ConceptSchemePicker.vue"
import ItemName from "./ItemName.vue"
import { indexingSchemes, createSubjectProvider } from "../utils.js"
import jskos from "jskos-tools"

// Full subject list from the parent component.
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

// Emit updated subject list back to the parent.
const emit = defineEmits(["update:modelValue"])

// Check whether one subject belongs to one scheme.
function subjectInScheme(subject, schemeUri) {
  return jskos.compare(
    { uri: subject?.inScheme?.[0]?.uri },
    { uri: schemeUri },
  )
}

// Replace only the subjects of the active scheme, keep the others unchanged.
function mergeSubjectsByScheme(current, schemeUri, nextSubjects) {
  const result = []
  let inserted = false

  for (const subject of current || []) {
    if (subjectInScheme(subject, schemeUri)) {
      if (!inserted) {
        result.push(...nextSubjects)
        inserted = true
      }
      continue
    }
    result.push(subject)
  }

  // If there were no subjects yet for this scheme, append them at the end.
  if (!inserted) {
    result.push(...nextSubjects)
  }

  return result
}

// Currently selected scheme in the dropdown.
const activeSchemeUri = ref(indexingSchemes[0].uri)

// All valid subjects from the parent value.
const subjects = computed(() =>
  (props.modelValue || []).filter(subject => subject?.uri),
)

// Find one scheme object by URI.
function findScheme(uri) {
  return indexingSchemes.find(scheme =>
    jskos.compare(scheme, { uri }),
  )
}

// Scheme currently active in the dropdown.
const activeScheme = computed(() =>
  findScheme(activeSchemeUri.value),
)

// Provider passed to ConceptSchemePicker for the active scheme.
const activeProvider = computed(() =>
  createSubjectProvider(activeScheme.value),
)

// Subjects only for the active scheme.
// Getter: what the picker should show now.
// Setter: merge picker changes back into the full subject list.
const activeSubjects = computed({
  get() {
    return subjects.value.filter(subject =>
      subjectInScheme(subject, activeSchemeUri.value),
    )
  },
  set(value) {
    const merged = mergeSubjectsByScheme(
      subjects.value,
      activeSchemeUri.value,
      value,
    )
    emit("update:modelValue", merged)
  },
})

// Stable key for one selected subject row.
function subjectKey(subject, i) {
  return `${subject.inScheme?.[0]?.uri || "scheme"}-${subject.uri || "empty"}-${i}`
}

// Remove one subject from the full list.
function remove(i) {
  const next = [...subjects.value]
  next.splice(i, 1)
  emit("update:modelValue", next)
}

// Move one subject one row up.
function up(i) {
  if (!i) {
    return
  }
  const next = [...subjects.value]
  ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
  emit("update:modelValue", next)
}

// Move one subject one row down.
function down(i) {
  if (i >= subjects.value.length - 1) {
    return
  }
  const next = [...subjects.value]
  ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
  emit("update:modelValue", next)
}
</script>

<style scoped>
.subject-editor {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.selected-subjects {
  margin-bottom: 0;
}

.selected-subjects td {
  vertical-align: middle;
  padding: 0 0 6px 0;
}

.selected-subjects tr:last-child td {
  padding-bottom: 0;
}

.scheme-col {
  min-width: 130px;
}

.subject-col {
  width: 100%;
  padding-left: 0.5rem !important;
}

.subject-box {
  border: 1px solid #adb5bd;
  border-radius: 6px;
  padding: 6px;
  background: #fff;
}

.actions-col {
  padding-left: 0.5rem !important;
  white-space: nowrap;
}

.subject-picker {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 0.5rem;
  align-items: start;
}

.picker-main {
  min-width: 0;
}
</style>
