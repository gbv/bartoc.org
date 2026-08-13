<template>
  <div class="editor-form-row">
    <label
      v-if="hasLabel"
      class="editor-form-label">{{ label }}</label>
    <div class="editor-form-content">
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
</script>

<style scoped>
.editor-form-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: var(--cc-space-md);
}

.editor-form-label {
  flex: 0 0 100%;
  padding-block: var(--cc-space-sm);
  margin-bottom: 0;
}

.editor-form-content {
  flex: 0 0 100%;
  min-width: 0;
  font-weight: var(--cc-font-weight-light);
}

@media (min-width: 36rem) {
  .editor-form-label {
    flex: 1 1 0;
  }

  .editor-form-content {
    flex: 5 1 0;
  }
}
</style>
