<template>
  <item-name
    :item="concept"
    :notation="!hideNotation" />
</template>

<script>
import ItemName from "./ItemName.vue"

// Show concept with notation for browsing
export default {
  components: { ItemName },
  props: {
    concept: {
      type: Object,
      required: true,
    },
    hideNotation: {
      type: Boolean,
      default: false,
    },
  },
}
</script>
