<template>
  <ul
    v-if="created || issued || showModified || resourceFormatLinks.length"
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
    <li v-if="resourceFormatLinks.length">
      <small aria-label="Resource formats">
        <i
          class="fas fa-code"
          aria-hidden="true" />
        <template
          v-for="(link, index) in resourceFormatLinks"
          :key="link.label">
          <span v-if="index"> / </span>
          <a :href="link.href">{{ link.label }}</a>
        </template>
      </small>
    </li>
  </ul>
</template>

<script setup>
import { computed } from "vue"
import { formatTimestamp } from "../utils/formatTimestamp.js"
import { withQuery } from "../utils/withQuery.js"

defineOptions({ name: "ItemDates" })

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
  resourcePath: {
    type: String,
    default: "",
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

const resourceFormatLinks = computed(() => {
  if (!props.item.uri || !props.resourcePath) {
    return []
  }

  return [
    {
      label: "JSKOS",
      href: withQuery("/api/data", { uri: props.item.uri }),
    },
    {
      label: "NT",
      href: withQuery(props.resourcePath, { format: "nt", inline: 1 }),
    },
    {
      label: "RDF",
      href: withQuery(props.resourcePath, { format: "rdfxml" }),
    },
  ]
})


</script>
