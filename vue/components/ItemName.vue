<template>
  <span v-if="item">
    <span v-if="notation && item.notation">
      <span
        class="jskos-notation"
        v-text="item.notation[0]" />
    </span>
    <span
      v-if="item.prefLabel && (prefLabel || (notation && !item.notation))"
      v-text="prefLabelToShow" />
    <span
      v-else-if="!notation || !item.notation"
      v-text="item.uri" />
  </span>
</template>

<script setup>
import jskos from "jskos-tools"
import { computed } from "vue"

/**
 * Display the notation and/or prefLabel of an item. If neither can be shown, display it's URI.
 */
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
  notation: {
    type: Boolean,
    default: false,
  },
  prefLabel: {
    type: Boolean,
    default: true,
  },
  language: {
    type: String,
    required: false,
    default: null,
  },
})

const prefLabelToShow = computed(() => {
  const { item, language } = props
  return item.prefLabel
    ? jskos.prefLabel(item, { fallbackToUri: false, language })
    : "???"
})

</script>

<style>
.jskos-notation {
  font-weight: var(--cc-font-weight-bold);
  padding-right: var(--cc-space-sm);
}
</style>
