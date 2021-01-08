<template>
  <span v-if="item">
    <span v-if="notation && item.notation">
      <span
        style="font-weight: bold; padding-right: 0.5em;"
        v-text="item.notation[0]" />
    </span>
    <span v-if="item.prefLabel && (prefLabel || (notation && !item.notation))">{{ prefLabelToShow }}</span>
    <span
      v-else-if="!notation || !item.notation"
      v-text="item.uri" />
  </span>
</template>

<script>
/**
 * Display the notation and/or prefLabel of an item or its URI as fallback.
 */
export default {
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
    // whether to show notation
    notation: {
      type: Boolean,
      default: false,
    },
    // whether to show prefLabel (will also be used as fallback for missing notation)
    prefLabel: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    prefLabelToShow() {
      const { prefLabel } = this.item
      if (prefLabel) {
        if ("en" in prefLabel) return prefLabel.en
        for (const lang in prefLabel) return prefLabel[lang]
      }
      return "???"
    },
  },
}
</script>
