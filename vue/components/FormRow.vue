<template>
  <div class="form-group row">
    <label class="col-form-label col-sm-2">{{ label }}</label>
    <div class="col-sm-10 font-weight-light">
      <slot />
    </div>
  </div>
</template>

<script>
/**
 * A row in a tabular form.
 */
export default {
  props: {
    label: {
      type: String,
      default: "",
    },
  },
}
</script>
