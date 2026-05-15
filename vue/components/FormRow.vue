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

<script setup>
import { computed } from "vue"

const props = defineProps({
  label: { type: String, default: "" },
})

const hasLabel = computed(() => props.label.trim().length > 0)
const contentClass = computed(() => hasLabel.value ? "col-sm-10" : "col-sm-12")
</script>
