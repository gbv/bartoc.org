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

<script>
import jskos from "jskos-tools"

/**
 * Display the notation and/or prefLabel of an item. If neither can be shown, display it's URI.
 */
export default {
  props: {
    // the item
    item: {
      type: Object,
      default: () => ({}),
    },
    // whether to show item's notation
    notation: {
      type: Boolean,
      default: false,
    },
    // whether to show item's prefLabel (always true if no notation is shown)
    prefLabel: {
      type: Boolean,
      default: true,
    },
    // preferred language
    language: {
      type: String,
      required: false,
    },
  },
  computed: {
    prefLabelToShow() {
      const { item, language } = this
      return item.prefLabel
        ? jskos.prefLabel(item, { fallbackToUri: false, language })
        : "???"
    },
  },
}
</script>

<style>
.jskos-notation {
  font-weight: bold;
  padding-right: 0.5em;
}
</style>
