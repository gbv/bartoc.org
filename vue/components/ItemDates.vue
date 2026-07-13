<template>
  <ul
    v-if="created || issued || showModified"
    class="list-inline text-right">
    <li
      v-if="created"
      class="list-inline-item">
      <small>created <time>{{ created }}</time></small>
    </li>
    <li
      v-if="issued"
      class="list-inline-item">
      <small>issued <time>{{ issued }}</time></small>
    </li>
    <li
      v-if="showModified"
      class="list-inline-item">
      <small>modified <time>{{ modified }}</time></small>
    </li>
  </ul>
</template>

<script setup>
import { computed } from "vue"

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
