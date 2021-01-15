<template>
  <Multiselect
    v-if="repeatable"
    v-model="value"
    mode="tags"
    :caret="false"
    :options="search"
    :filter-results="false"
    :min-chars="0"
    :resolve-on-load="true"
    :delay="0"
    :searchable="true"
    :loading="isLoading"
    :max-height="300"
    @change="$emit('update:modelValue', $event)" />
  <Multiselect
    v-else
    v-model="value"
    :options="search"
    :filter-results="false"
    :min-chars="0"
    :resolve-on-load="true"
    :delay="0"
    :searchable="true"
    :loading="isLoading"
    :max-height="300"
    @change="$emit('update:modelValue', $event)" />
</template>

<script>
import Multiselect from "@vueform/multiselect"
import cdk from "cocoda-sdk"

const scheme = { uri: "http://bartoc.org/en/node/20287" }
const registry = cdk.initializeRegistry({
  provider: "ConceptApi",
  api: "/api/",
  schemes: [scheme],
})

/**
 * Select one or a list of languages.
 */
export default {
  components: {
    Multiselect,
  },
  props: {
    modelValue: {
      type: [Array, String],
      default: () => "",
    },
    repeatable: Boolean,
  },
  emits: ["update:modelValue"],
  data() {
    return {
      value: (this.modelValue || (this.repeatable ? [] : "und")),
      isLoading: false,
      cancel: null,
    }
  },
  methods: {
    async search(query) {

      this.isLoading = true
      // cancel previos request if necessary
      this.cancel && this.cancel("canceled")

      let promise
      if (query) {
        promise = registry.search({ search: query, scheme })
      } else {
        promise = registry.getTop({ scheme })
      }
      this.cancel = promise.cancel

      let results = []
      try {
        results = await promise
      } catch (error) {
        if (error.message === "canceled") {
          return
        }
        // seems to be a network error, logging to console
        console.error(error)
        results = []
      }

      this.cancel = null
      this.isLoading = false

      return results.map(c => ({
        value: c.notation[0], label: c.prefLabel.en,
      }))
    },
  },
}
</script>

<style src="@vueform/multiselect/themes/default.css"></style>
<style>
/* Adjust for Bootstrap CSS */
div.multiselect {
  border: 0;
  padding: 0;
}
div.multiselect-input, div.multiselect-options {
  border: 1px solid #ced4da;
}
div.multiselect-options {
  overflow-x: hidden;
}
div.multiselect.form-control {
  height: inherit;
}
</style>
