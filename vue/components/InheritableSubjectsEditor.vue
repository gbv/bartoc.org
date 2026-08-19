<!--
Add version inheritance to SubjectEditor:

- inherited: show subjects from the main record as read-only;
- override: edit subjects stored on this version;
- editable: use the normal editor when there is no value to inherit.

Subjects with MAPPING are mapped, not inherited. Only the local value is sent
to ItemEditor. The source stays read-only until the user starts an override.
-->
<template>
  <InheritedFieldControl
    :mode="mode"
    :source="subjectSource"
    @start-override="startOverride"
    @use-main="useMain">
    <template #inherited>
      <div data-testid="inherited-subjects">
        <SubjectEditor
          :model-value="subjectSource.subject"
          read-only />
      </div>
    </template>
    <template #editor>
      <SubjectEditor v-model="subjects" />
    </template>
  </InheritedFieldControl>
</template>

<script setup>
import { computed, ref, toRaw } from "vue"
import { hasMeaningfulValue } from "../utils/itemEditor.js"
import InheritedFieldControl from "./InheritedFieldControl.vue"
import SubjectEditor from "./SubjectEditor.vue"

defineOptions({ name: "InheritableSubjectsEditor" })

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  source: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(["update:modelValue"])

// Keep override mode while the user removes and replaces subjects.
const overrideActive = ref(hasMeaningfulValue(props.modelValue))

// ItemEditor already checked that source matches versionOf.
// Use it only when it has subjects.
const subjectSource = computed(() =>
  props.source?.uri && hasMeaningfulValue(props.source.subject)
    ? props.source
    : null,
)

// Local subjects replace the whole inherited field.
const mode = computed(() => {
  if (!subjectSource.value) {
    return "editable"
  }

  return overrideActive.value || hasMeaningfulValue(props.modelValue)
    ? "override"
    : "inherited"
})

const subjects = computed({
  get: () => props.modelValue,
  set: (value) => {
    // Editing starts a local override, even when the list is empty.
    overrideActive.value = true
    emit("update:modelValue", value)
  },
})

function startOverride() {
  if (!subjectSource.value) {
    return
  }

  // Copy all inherited subjects. Never change the source.
  overrideActive.value = true
  emit(
    "update:modelValue",
    structuredClone(toRaw(subjectSource.value.subject)),
  )
}

function useMain() {
  if (!subjectSource.value) {
    return
  }

  // cleanupItem removes this empty array from the saved item.
  overrideActive.value = false
  emit("update:modelValue", [])
}

function validationError() {
  // An empty override must not silently switch to inheritance.
  if (mode.value === "override" && !hasMeaningfulValue(props.modelValue)) {
    return {
      message: "Select a subject or use the value from the main record.",
    }
  }
}

defineExpose({ validationError })
</script>
