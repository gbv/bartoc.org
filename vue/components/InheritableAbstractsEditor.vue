<!--
Show inherited definitions as read-only text or edit a local definition.
The local value is always sent to ItemEditor through v-model.
-->
<template>
  <InheritedFieldControl
    :mode="mode"
    :source="definitionSource"
    @start-override="startOverride"
    @use-main="useMain">
    <template #inherited>
      <div data-testid="inherited-definition">
        <LocalizedAbstract :abstract="definitionSource.definition" />
      </div>
    </template>
    <template #editor>
      <AbstractsEditor
        v-model="definition"
        :require-english="requireEnglish" />
    </template>
  </InheritedFieldControl>
</template>

<script setup>
import { useInheritableField } from "../composables/useInheritableField.js"
import AbstractsEditor from "./AbstractsEditor.vue"
import InheritedFieldControl from "./InheritedFieldControl.vue"
import LocalizedAbstract from "./LocalizedAbstract.vue"

defineOptions({ name: "InheritableAbstractsEditor" })

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  source: {
    type: Object,
    default: null,
  },
  requireEnglish: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["update:modelValue"])

const {
  sourceRecord: definitionSource,
  fieldMode: mode,
  localValue: definition,
  startOverride,
  useMain,
  validationError,
} = useInheritableField(props, emit, {
  field: "definition",
  createEmptyValue: () => ({}),
  validationMessage: "Enter an abstract or use the value from the main record.",
})

defineExpose({ validationError })
</script>
