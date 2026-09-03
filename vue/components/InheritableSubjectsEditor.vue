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
import { useInheritableField } from "../composables/useInheritableField.js"
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

const {
  sourceRecord: subjectSource,
  fieldMode: mode,
  localValue: subjects,
  startOverride,
  useMain,
  validationError,
} = useInheritableField(props, emit, {
  field: "subject",
  createEmptyValue: () => [],
  validationMessage: "Select a subject or use the value from the main record.",
})

defineExpose({ validationError })
</script>
