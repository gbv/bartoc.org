<template>
  <InheritedFieldControl
    :mode="mode"
    :source="notationSource"
    @start-override="startOverride"
    @use-main="useMain">
    <template #inherited>
      <span data-testid="inherited-notation">
        {{ notationSource.notation.join(", ") }}
      </span>
    </template>
    <template #editor>
      <input
        v-model="abbreviation"
        type="text"
        class="cc-form-control"
        data-testid="notation-editor">
    </template>
  </InheritedFieldControl>
</template>

<script setup>
import { computed } from "vue"
import { useInheritableField } from "../composables/useInheritableField.js"
import InheritedFieldControl from "./InheritedFieldControl.vue"

defineOptions({ name: "AbbreviationEditor" })

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
  sourceRecord: notationSource,
  fieldMode: mode,
  updateLocalValue,
  startOverride,
  useMain,
  validationError,
} = useInheritableField(props, emit, {
  field: "notation",
  createEmptyValue: () => [],
  validationMessage: "Enter an abbreviation or use the value from the main record.",
})

const abbreviation = computed({
  get: () => props.modelValue[0] || "",
  set: (value) => {
    const notation = [...props.modelValue]
    notation[0] = value
    updateLocalValue(notation)
  },
})

defineExpose({ validationError })
</script>
