<template>
  <small
    v-if="source?.uri"
    class="inherited-field-notice"
    data-testid="inherited-field-notice">
    Inherited from <ItemLink :item="source" />.
  </small>
</template>

<script setup>
import ItemLink from "./ItemLink.vue"

defineOptions({ name: "InheritedFieldNotice" })

// Provenance remains beside the effective value instead of becoming JSKOS.
defineProps({
  source: {
    type: Object,
    default: null,
  },
})
</script>

<style scoped>
.inherited-field-notice {
  display: block;
  margin-top: var(--cc-space-xs);
  color: var(--cc-color-muted);
  font-size: var(--cc-font-size-sm);
}
</style>
