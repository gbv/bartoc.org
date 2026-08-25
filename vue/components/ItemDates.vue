<template>
  <ul
    v-if="created || issued || showModified"
    class="item-dates separated-list">
    <li
      v-if="created">
      <small>created <time :datetime="created">{{ formatTimestamp(created) }}</time></small>
    </li>
    <li
      v-if="issued">
      <small>issued <time :datetime="issued">{{ formatTimestamp(issued) }}</time></small>
    </li>
    <li
      v-if="showModified">
      <small>modified <time :datetime="modified">{{ formatTimestamp(modified) }}</time></small>
    </li>
  </ul>
</template>

<script setup>
import { computed } from "vue"
import { formatTimestamp } from "../utils.js"

defineOptions({ name: "ItemDates" })

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const created = computed(() => props.item.created)
const issued = computed(() => props.item.issued)
const modified = computed(() => props.item.modified)
const showModified = computed(() => (
  modified.value
  && modified.value !== created.value
  && modified.value !== issued.value
))
</script>
