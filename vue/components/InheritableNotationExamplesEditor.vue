<!--
Show notation examples from the main record or edit a complete local override.
Only the local value is sent to ItemEditor through v-model.
-->
<template>
  <InheritedFieldControl
    :mode="notationExamplesFieldMode"
    :source="notationExamplesSourceRecord"
    @start-override="startLocalOverride"
    @use-main="useNotationExamplesFromMainRecord">
    <template #inherited>
      <span data-testid="inherited-notation-examples">
        {{ notationExamplesSourceRecord.notationExamples.join(", ") }}
      </span>
    </template>
    <template #editor>
      <input
        :value="notationExamplesText"
        type="text"
        class="cc-form-control"
        data-testid="notation-examples-editor"
        @input="updateNotationExamples">
    </template>
  </InheritedFieldControl>
</template>

<script setup>
import { ref } from "vue"
import { useInheritableField } from "../composables/useInheritableField.js"
import { parseNotationExamples } from "../utils/itemEditor.js"
import InheritedFieldControl from "./InheritedFieldControl.vue"

defineOptions({ name: "InheritableNotationExamplesEditor" })

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
const notationExamplesText = ref(props.modelValue.join(", "))

const {
  sourceRecord: notationExamplesSourceRecord,
  fieldMode: notationExamplesFieldMode,
  updateLocalValue,
  startOverride,
  useMain,
  validationError,
} = useInheritableField(props, emit, {
  field: "notationExamples",
  createEmptyValue: () => [],
  validationMessage:
    "Enter an example notation or use the value from the main record.",
})

// Store the comma-separated input as a list.
function updateNotationExamples(event) {
  notationExamplesText.value = event.target.value
  updateLocalValue(parseNotationExamples(notationExamplesText.value))
}

// Copy the complete main list into a local override.
function startLocalOverride() {
  const notationExamples = startOverride()
  if (!notationExamples) {
    return
  }

  notationExamplesText.value = notationExamples.join(", ")
}

// Remove the local list and inherit from the main record again.
function useNotationExamplesFromMainRecord() {
  useMain()
  notationExamplesText.value = ""
}

defineExpose({ validationError })
</script>
