<template>
  <div class="form-group row">
    <label
      v-if="hasLabel"
      class="col-form-label col-sm-2">{{ label }}</label>
    <div
      :class="contentClass"
      class="font-weight-light">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    label: { type: String, default: "" },
  },
  computed: {
    hasLabel() {
      return this.label.trim().length > 0
    },
    contentClass() {
      return this.hasLabel ? "col-sm-10" : "col-sm-12"
    },
  },
}
</script>
