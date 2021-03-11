<template>
  <a :href="endpoint.url">{{ endpoint.url }}</a>
  (<item-name :item="apiType" />)
  <a
    v-if="cocoda"
    class="btn btn-sm btn-primary"
    style="margin-left: 1em"
    :href="cocoda">Cocoda Mapping Tool</a>
</template>

<script>
import ItemName from "./ItemName"
import { apiTypesScheme } from "../utils.js"
import { registryForScheme } from "../utils"

const registry = registryForScheme(apiTypesScheme)

// Show scheme service API URL and links to services based on the API
export default {
  components: { ItemName },
  props: {
    // TODO: watch endpoint and reload on change
    endpoint: {
      type: Object,
      required: true,
    },
    scheme: {
      type: Object,
      required: true,
    },
  },
  // TODO: watch endpoint and reload on change
  data() {
    const cocoda = this.endpoint.url.match(/^https?:\/\/(api\.dante\.gbv\.de|coli-conc\.gbv\.de\/api)\//)
      ? "https://coli-conc.gbv.de/cocoda/app/?fromScheme=" + encodeURIComponent(this.scheme.uri) : ""
    return {
      cocoda,
      apiType: { uri: this.endpoint.type },
    }
  },
  async mounted() {
    const result = await registry.getConcepts({ concepts: [ this.apiType ] })
    if (result.length) {
      this.apiType = result[0]
    }
  },
}
</script>
