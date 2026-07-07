<template>
  <BartocFooter
    :site-name="siteName"
    api-url="/api/"
    download-url="/download"
    :external-links="externalLinks"
    :resource-format-links="resourceFormatLinks" />
</template>

<script setup>
import { computed, inject } from "vue"
import { BartocFooter } from "@gbv/bartoc-components"

defineOptions({ name: "TheFooter" })

// Default footer context is provided by the root app from EJS data attributes.
const providedFooter = inject("footer", {})

// Props stay available for tests and for pages that need an explicit override.
const props = defineProps({
  siteName: {
    type: String,
    default: "",
  },
  itemUri: {
    type: String,
    default: "",
  },
  api: {
    type: String,
    default: "",
  },
  query: {
    type: Object,
    default: null,
  },
})

const siteName = computed(() => props.siteName || providedFooter.siteName || "BARTOC.org")
const itemUri = computed(() => props.itemUri || providedFooter.itemUri || "")
const api = computed(() => props.api || providedFooter.api || "")
const queryParams = computed(() => props.query || providedFooter.query || {})

const externalLinks = [
  { label: "Mastodon", href: "https://code4lib.social/@bartoc", rel: "me" },
  { label: "sources", href: "https://github.com/gbv/bartoc.org" },
  { label: "issues", href: "https://github.com/gbv/bartoc.org/issues" },
]

const resourceFormatLinks = computed(() => {
  // Item pages expose all resource formats; list/API pages expose JSON only.
  if (itemUri.value) {
    return [
      { label: "JSON", href: withQuery("/api/data", { uri: itemUri.value }) },
      { label: "RDF", href: withQuery("/vocabularies", { uri: itemUri.value, format: "nt" }) },
      { label: "XML", href: withQuery("/vocabularies", { uri: itemUri.value, format: "rdfxml" }) },
    ]
  }

  if (api.value) {
    return [
      { label: "JSON", href: withQuery(`/api/${api.value}`, queryParams.value) },
    ]
  }

  return []
})

function withQuery(path, params) {
  const query = new URLSearchParams()

  // Build footer URLs with proper query escaping. Empty values are omitted,
  // while arrays stay repeatable, e.g. ?tag=a&tag=b.
  for (let [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") {
      continue
    }

    if (Array.isArray(value)) {
      value.forEach(entry => query.append(key, entry))
    } else {
      query.set(key, value)
    }
  }

  const queryString = query.toString()
  return queryString ? `${path}?${queryString}` : path
}
</script>
