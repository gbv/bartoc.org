<template>
  <input
    v-if="repeatable"
    type="text"
    :value="(modelValue||[]).join(', ')"
    @input="$emit('update:modelValue', $event.target.value.split(/\\s*,\\s*/))">
  <input
    v-else
    type="text"
    maxlength="3"
    size="3"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)">
</template>

<script>
/**
 * Select one or a list of languages (should be extened to show full language names).
 */
export default {
  props: {
    modelValue: {
      type: [Array, String],
      default: () => "",
    },
    repeatable: Boolean,
  },
  emits: ["update:modelValue"],
}
</script>
