<template>
  <select
    v-if="repeatable"
    v-model="value"
    multiple
    :size="options.length"
    class="form-control">
    <option
      v-for="opt in options"
      :key="opt.uri"
      :value="opt.uri">
      <item-name :item="opt" />
    </option>
  </select>
  <select
    v-else
    v-model="value"
    class="form-control">
    <option
      v-for="opt in options"
      :key="opt.uri"
      :value="opt.uri">
      <item-name :item="opt" />
    </option>
  </select>
</template>

<script setup>
import ItemName from "./ItemName.vue"
import { computed } from "vue"

/**
 * HTML Select form to select one or multiple values from a JSKOS set.
 */
const props = defineProps({
  modelValue: {
    type: [Array, Object],
    required: true,
  },
  options: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(["update:modelValue"])

const repeatable = computed(() => Array.isArray(props.modelValue))
const value = computed({
  get: () => toSelectValue(props.modelValue),
  set: selectValue => {
    emit("update:modelValue", toModelValue(selectValue))
  },
})

function toSelectValue(modelValue) {
  return Array.isArray(modelValue)
    ? modelValue.map(item => item.uri)
    : modelValue.uri || ""
}

function toModelValue(selectValue) {
  return Array.isArray(selectValue)
    ? selectValue.map(uri => ({ uri }))
    : { uri: selectValue }
}
</script>
