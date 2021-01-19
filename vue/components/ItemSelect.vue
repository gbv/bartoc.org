<template>
  <Multiselect
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
import jskos from "jskos-tools"
import { initializeRegistryForScheme } from "../utils"

/**
 * Select one or a list of languages.
 */
export default {
  components: {
    Multiselect,
  },
  props: {
    modelValue: {
      type: String,
      default: () => "",
    },
    scheme: {
      type: Object,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      value: this.modelValue,
      isLoading: false,
      cancel: null,
      registry: null,
    }
  },
  watch: {
    scheme() {
      this.initializeRegistry()
    },
  },
  created() {
    this.initializeRegistry()
  },
  methods: {
    initializeRegistry() {
      this.registry = this.scheme ? initializeRegistryForScheme(this.scheme) : null
    },
    async search(query) {
      if (!this.registry) {
        return []
      }

      this.isLoading = true
      // cancel previos request if necessary
      this.cancel && this.cancel("canceled")

      let promise
      if (query) {
        promise = this.registry.search({ search: query, scheme: this.scheme })
      } else {
        promise = this.registry.getTop({ scheme: this.scheme })
      }
      this.cancel = promise.cancel

      let results = []
      try {
        results = await promise
        // for top concepts, sort them
        if (!query) {
          results = jskos.sortConcepts(results)
        }
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
        value: c.uri, label: `${jskos.notation(c)} ${jskos.prefLabel(c)}`,
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
