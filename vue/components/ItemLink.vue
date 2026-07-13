<template>
  <a
    v-if="href"
    :href="href"
    :lang="languageCode">
    {{ label }}
  </a>
  <span
    v-else
    :lang="languageCode">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from "vue"

defineOptions({ name: "ItemLink" })

const props = defineProps({
  item: {
    type: Object,
    default: null,
  },
  base: {
    type: String,
    default: "",
  },
  language: {
    type: String,
    default: "en",
  },
  withNotation: {
    type: Boolean,
    default: false,
  },
})

const bartocUri = /^http:\/\/bartoc\.org\/en\/node\/[1-9][0-9]+$/

const languageCode = computed(() => {
  const labels = props.item?.prefLabel || {}
  return props.language in labels
    ? props.language
    : Object.keys(labels)[0] || props.language
})

const href = computed(() => {
  const item = props.item
  if (!item) {
    return ""
  }

  if (item.uri) {
    if (bartocUri.test(item.uri)) {
      return `/en/node/${item.uri.split("/").pop()}`
    }
    if (props.base) {
      const separator = props.base.endsWith("=") ? "" : "?uri="
      return `${props.base}${separator}${encodeURIComponent(item.uri)}`
    }
    return item.uri
  }

  return item.url || ""
})

const label = computed(() => {
  const item = props.item
  if (!item) {
    return "?"
  }

  const labels = item.prefLabel || {}
  const value = labels[languageCode.value] || item.uri || "?"
  return props.withNotation && item.notation?.length
    ? `${value} (${item.notation[0]})`
    : value
})
</script>
