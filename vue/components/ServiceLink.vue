<template>
  <a :href="endpoint.url">{{ endpoint.url }}</a>
  (<item-name :item="apiType" />)
  <a
    v-if="cocoda"
    class="cc-button cc-button-primary cc-button-sm service-link-cocoda"
    :href="cocoda">Cocoda Mapping Tool</a>
</template>

<script setup>
import { ref, watch } from "vue"
import ItemName from "./ItemName.vue"
import { apiTypesScheme, registryForScheme } from "../utils.js"

const registry = registryForScheme(apiTypesScheme)

const props = defineProps({
  endpoint: {
    type: Object,
    required: true,
  },
  scheme: {
    type: Object,
    required: true,
  },
})

const cocoda = ref("")
const apiType = ref({})

async function reload() {
  cocoda.value = props.endpoint.url.match(/^https?:\/\/(api\.dante\.gbv\.de|coli-conc\.gbv\.de\/api)\//)
    ? "https://coli-conc.gbv.de/cocoda/app/?fromScheme=" + encodeURIComponent(props.scheme.uri) : ""
  apiType.value = { uri: props.endpoint.type }

  const currentApiType = apiType.value
  const result = await registry.getConcepts({ concepts: [currentApiType] })
  if (apiType.value === currentApiType && result.length) {
    apiType.value = result[0]
  }
}

watch(() => props.endpoint, reload, { deep: true, immediate: true })
</script>

<style scoped>
.service-link-cocoda {
  margin-left: var(--cc-space-md);
}
</style>
