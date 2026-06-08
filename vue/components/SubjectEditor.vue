<template>
  <div class="subject-editor">
    <!-- Show all selected subjects, independent from the active scheme -->
    <table
      v-if="editableSubjects.length"
      class="table table-sm table-borderless selected-subjects">
      <tbody>
        <tr
          v-for="({ subject }, i) in editableSubjects"
          :key="subjectKey(subject, i)">
          <!-- Scheme label, e.g. DDC / EUROVOC / ILC -->
          <td
            class="scheme-col">
            <item-name
              :item="findScheme(subject.inScheme?.[0]?.uri)"
              :notation="true"
              :pref-label="false" />
          </td>

          <!-- Selected concept -->
          <td
            class="subject-col">
            <div class="subject-box">
              <item-name
                :item="subject"
                :notation="true" />
            </div>
          </td>

          <!-- Reorder / remove buttons -->
          <td
            class="actions-col">
            <div class="cc-button-group">
              <button
                :disabled="!i"
                type="button"
                class="cc-button cc-button-secondary cc-button-icon"
                @click="moveEditableSubject(i, -1)">
                &#9650;
              </button>
              <button
                :disabled="i >= editableSubjects.length - 1"
                type="button"
                class="cc-button cc-button-secondary cc-button-icon"
                @click="moveEditableSubject(i, 1)">
                &#9660;
              </button>
              <button
                type="button"
                class="cc-button cc-button-secondary cc-button-icon"
                @click="removeEditableSubject(i)">
                &times;
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Single picker area: one dropdown + one JskosItemPicker -->
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
        <jskos-item-picker
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
import JskosItemPicker from "./JskosItemPicker.vue"
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

function isDerivedSubject(subject) {
  return Object.prototype.hasOwnProperty.call(subject || {}, "MAPPING")
}

// Replace only manually editable subjects of the active scheme.
// Derived subjects are hidden from the editor, but must pass through unchanged
// so the parent can still save the complete subject list.
function mergeSubjectsByScheme(current, schemeUri, nextSubjects) {
  const result = []
  let inserted = false

  for (const subject of current || []) {
    if (
      subjectInScheme(subject, schemeUri) &&
      !isDerivedSubject(subject)
    ) {
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
  // Filter out invalid subjects (without URI),
  // but keep derived subjects so they can pass through to the parent unchanged.
  (props.modelValue || []).filter(subject => subject?.uri),
)

// UI projection of the complete subject list: only manually editable subjects
// are rendered, while their original indexes keep mutations anchored to the
// complete modelValue array.
const editableSubjects = computed(() =>
  subjects.value
    .map((subject, index) => ({ subject, index }))
    .filter(({ subject }) => !isDerivedSubject(subject)),
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

// Provider passed to JskosItemPicker for the active scheme.
const activeProvider = computed(() =>
  createSubjectProvider(activeScheme.value),
)

// Subjects only for the active scheme.
// Getter: what the picker should show now.
// Setter: merge picker changes back into the full subject list.
const activeSubjects = computed({
  get() {
    return subjects.value.filter(subject =>
      !isDerivedSubject(subject) &&
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

// Remove one visible subject from the full list by its original index.
function removeEditableSubject(i) {
  const subjectIndex = editableSubjects.value[i]?.index
  if (subjectIndex === undefined) {
    return
  }

  const next = [...subjects.value]
  next.splice(subjectIndex, 1)
  emit("update:modelValue", next)
}

// Move visible subjects within their editable slots; derived subjects keep their
// original positions in the complete list.
function moveEditableSubject(i, direction) {
  const target = i + direction
  if (target < 0 || target >= editableSubjects.value.length) {
    return
  }

  const next = [...subjects.value]
  const fromIndex = editableSubjects.value[i].index
  const toIndex = editableSubjects.value[target].index

  ;[next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]]
  emit("update:modelValue", next)
}
</script>

<style scoped>
.subject-editor {
  display: flex;
  flex-direction: column;
  gap: var(--cc-row-padding-x);
}

.selected-subjects {
  margin-bottom: 0;
}

.selected-subjects td {
  vertical-align: middle;
  padding: 0 0 var(--cc-space-sm) 0;
}

.selected-subjects tr:last-child td {
  padding-bottom: 0;
}

.scheme-col {
  min-width: 130px;
}

.subject-col {
  width: 100%;
  padding-left: var(--cc-space-sm) !important;
}

.subject-box {
  border: 1px solid var(--cc-border-color-strong);
  border-radius: var(--cc-radius-md);
  padding: var(--cc-space-sm);
  background: var(--cc-color-surface);
}

.actions-col {
  padding-left: var(--cc-space-sm) !important;
  white-space: nowrap;
}

.subject-picker {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: var(--cc-space-sm);
  align-items: start;
}

.picker-main {
  min-width: 0;
}
</style>
