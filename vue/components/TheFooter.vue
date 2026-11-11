<template>
  <BartocFooter
    :site-name="siteName"
    :external-links="externalLinks"
    :internal-links="internalLinks" />
</template>

<script setup>
import { computed, inject } from "vue"
import { BartocFooter } from "@gbv/bartoc-components"

defineOptions({ name: "TheFooter" })

// The root app provides footer context for the current page.
const providedFooter = inject("footer", {})

// Props stay available for tests and for pages that need an explicit override.
const props = defineProps({
  siteName: {
    type: String,
    default: "",
  },
})

const siteName = computed(() => props.siteName || providedFooter.siteName || "BARTOC.org")

const externalLinks = [
  { label: "Imprint", href: "https://www.gbv.de/impressum" },
  { label: "Privacy Policy", href: "https://www.gbv.de/datenschutz" },
  { label: "Mastodon", href: "https://code4lib.social/@bartoc", rel: "me" },
  { label: "BARTOC sources", href: "https://github.com/gbv/bartoc.org" },
  { label: "issues", href: "https://github.com/gbv/bartoc.org/issues" },
]

const internalLinks = [
  { href: "/api/", label: "API" },
  { href: "/download", label: "download" },
  { href: "/graph/", label: "SPARQL" },
]

</script>
