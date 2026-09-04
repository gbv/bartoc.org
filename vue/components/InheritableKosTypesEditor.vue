<template>
  <InheritedFieldControl
    :mode="mode"
    :source="sourceRecord"
    @start-override="startOverride"
    @use-main="useMain">
    <template #inherited>
      <JskosItemPicker
        :model-value="inheritedKosTypes"
        :provider="provider"
        readonly />
    </template>
    <template #editor>
      <JskosItemPicker
        v-model="localKosTypes"
        :provider="provider"
        placeholder="Search KOS types…" />
    </template>
  </InheritedFieldControl>
</template>

<script setup>
import { kosTypeUris } from "../../src/versioning.js"
import { useInheritableField } from "../composables/useInheritableField.js"
import InheritedFieldControl from "./InheritedFieldControl.vue"
import JskosItemPicker from "./JskosItemPicker.vue"

defineOptions({ name: "InheritableKosTypesEditor" })

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  source: {
    type: Object,
    default: null,
  },
  provider: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["update:modelValue"])

function toKosTypeItems(item) {
  return kosTypeUris(item).map(uri => ({ uri }))
}

const {
  sourceRecord,
  inheritedValue: inheritedKosTypes,
  fieldMode: mode,
  localValue: localKosTypes,
  startOverride,
  useMain,
  validationError,
} = useInheritableField(props, emit, {
  field: "type",
  getInheritedValue: toKosTypeItems,
  createEmptyValue: () => [],
  validationMessage: "Select a KOS type or use the value from the main record.",
})

defineExpose({ validationError })
</script>
