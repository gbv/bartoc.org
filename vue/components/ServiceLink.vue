<template>
  <a :href="api">{{ api }}</a>
  <a
    v-if="cocoda"
    class="btn btn-sm btn-primary"
    style="margin-left: 1em"
    :href="cocoda">Cocoda Mapping Tool</a>
</template>

<script>
/**
 * Show vocabulary service API URL and links to services based on the API.
 */
export default {
  props: {
    api: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    vocabulary: {
      type: String,
      required: true,
    },
  },
  data() {
    const cocoda = this.api.match(/^https?:\/\/(api\.dante\.gbv\.de|coli-conc\.gbv\.de\/api)\//)
      ? "https://coli-conc.gbv.de/cocoda/app/?fromScheme=" + encodeURIComponent(this.vocabulary) : ""
    return {
      cocoda,
    }
  },
}
</script>
