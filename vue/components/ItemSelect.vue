<template>
  <Multiselect
    v-if="repeatable"
    ref="multiselect"
    v-model="value"
    mode="tags"
    :caret="false"
    :options="search"
    :filter-results="false"
    :min-chars="0"
    :resolve-on-load="true"
    :delay="200"
    :searchable="true"
    :loading="isLoading"
    :max-height="300"
    @change="$emit('update:modelValue', $event)" />
  <Multiselect
    v-else
    ref="multiselect"
    v-model="value"
    :options="search"
    :filter-results="false"
    :min-chars="0"
    :resolve-on-load="true"
    :delay="200"
    :searchable="true"
    :loading="isLoading"
    :max-height="300"
    @change="$emit('update:modelValue', $event)" />
</template>

<script>
import Multiselect from "@vueform/multiselect"
import jskos from "jskos-tools"
import { initializeRegistry } from "../utils"

/**
 * Select one or a list of languages.
 */
export default {
  components: {
    Multiselect,
  },
  props: {
    modelValue: {
      type: [String, Array],
      default: () => this.repeatable ? [] : "",
    },
    repeatable: {
      type: Boolean,
      default: false,
    },
    scheme: {
      type: Object,
      required: true,
    },
    extractValue: {
      type: Function,
      default: (concept) => concept.uri,
    },
    extractLabel: {
      type: Function,
      default: (concept) => `${jskos.notation(concept)} ${jskos.prefLabel(concept)}`,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      value: this.modelValue || (this.repeatable ? [] : null),
      isLoading: false,
      cancel: null,
      registry: null,
    }
  },
  watch: {
    scheme(newScheme, oldScheme) {
      if (!jskos.compare(newScheme, oldScheme)) {
        this.initializeRegistry()
      }
    },
  },
  created() {
    this.initializeRegistry()
  },
  methods: {
    initializeRegistry() {
      this.registry = (this.scheme||{}).API ? initializeRegistry(this.scheme.API[0]) : null
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
        value: this.extractValue(c), label: this.extractLabel(c),
      }))
    },
    focus() {
      const input = this.$refs.multiselect && this.$refs.multiselect.input
      input && input.focus()
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
