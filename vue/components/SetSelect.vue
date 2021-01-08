<template>
  <select
    v-if="repeatable()"
    v-model="value"
    multiple
    :size="options.length"
    class="form-control">
    <option
      v-for="opt in options"
      :key="opt.uri"
      :value="{ uri: opt.uri }">
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
      :value="{ uri: opt.uri }">
      <item-name :item="opt" />
    </option>
  </select>
</template>

<script>
import ItemName from "./ItemName.vue"

/**
 * HTML Select form to select one or multiple values from a JSKOS set.
 */
export default {
  components: { ItemName },
  props: {
    modelValue: {
      type: [Array, Object],
      required: true,
    },
    options: {
      type: Array,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      value: this.repeatable() ? [...this.modelValue] : this.modelValue,
    }
  },
  created() {
    this.$watch("value", value => { this.$emit("update:modelValue", value) })
  },
  methods: {
    repeatable() { return Array.isArray(this.modelValue) },
  },
}
</script>
