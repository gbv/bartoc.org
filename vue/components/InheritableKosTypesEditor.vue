<template>
  <InheritedFieldControl
    :mode="mode"
    :source="sourceRecord"
    @start-override="startOverride"
    @use-main="useMain">
    <template #inherited>
      <ul data-testid="inherited-kos-types">
        <li
          v-for="kosType in inheritedKosTypes"
          :key="kosType.uri">
          <ItemName :item="displayKosType(kosType)" />
        </li>
      </ul>
    </template>
    <template #editor>
      <SetSelect
        v-model="localKosTypes"
        :options="options" />
    </template>
  </InheritedFieldControl>
</template>

<script setup>
import { kosTypeUris } from "../../src/versioning.js"
import { useInheritableField } from "../composables/useInheritableField.js"
import InheritedFieldControl from "./InheritedFieldControl.vue"
import ItemName from "./ItemName.vue"
import SetSelect from "./SetSelect.vue"

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
  options: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["update:modelValue"])

function toKosTypeItems(item) {
  return kosTypeUris(item).map(uri => ({ uri }))
}

function displayKosType(kosType) {
  return props.options.find(option => option.uri === kosType.uri) || kosType
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
