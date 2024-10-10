<template>
  <Multiselect
    v-if="repeatable"
    ref="multiselect"
    v-model="value"
    mode="tags"
    :caret="false"
    :options="options"
    :filter-results="false"
    :min-chars="0"
    :resolve-on-load="true"
    :delay="200"
    :searchable="true"
    :loading="isLoading"
    @change="$emit('update:modelValue', $event)" />
  <Multiselect
    v-else
    ref="multiselect"
    v-model="value"
    :options="options"
    :filter-results="false"
    :min-chars="0"
    :resolve-on-load="true"
    :delay="200"
    :searchable="true"
    :loading="isLoading"
    @change="$emit('update:modelValue', $event)" />
</template>

<script>
import Multiselect from "@vueform/multiselect"
import jskos from "jskos-tools"
import { registryForScheme, sortConcepts } from "../utils.js"

// Select one or a list of item URIs
export default {
  components: {
    Multiselect,
  },
  props: {
    modelValue: {
      type: [String, Array],
      default(props) {
        return props.repeatable ? [] : ""
      },
    },
    repeatable: {
      type: Boolean,
      default: false,
    },
    allrepeatable: {
      type: Boolean,
      default: false,
    },
    depth: {
      type: Number,
      default: 1,
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
    }
  },
  computed: {
    registry() {
      return registryForScheme(this.scheme)
    },
    options() {
      return this.registry ? this.search : (this.scheme.concepts || [])
    },
  },
  methods: {
    async search(query) {
      if (!this.registry) {
        return []
      }

      this.isLoading = true
      // cancel previous request if necessary
      this.cancel && this.cancel("canceled")

      let promise
      if (query) {
        promise = this.registry.search({ search: query, scheme: this.scheme })
      } else {
        const params = this.depth > 1 ? { properties: "*" } : null
        promise = this.registry.getTop({ scheme: this.scheme, params })
        // TODO: support more then 2 levels or better use another component for hierarchy browsing?
      }
      this.cancel = promise.cancel

      let results = []
      try {
        results = await promise
        // for top concepts, sort them
        if (!query) {
          results = sortConcepts(results, this.scheme)
            // add direct child concepts in between
            .map(({narrower, ...concept}) => {
              narrower = (narrower||[]).filter(Boolean).map(
                c => {
                  if (c.prefLabel) {
                    for (let lang in c.prefLabel) {
                      c.prefLabel[lang] = `— ${c.prefLabel[lang]}`
                    }
                  }
                  return c
                },
              )
              return [concept, ...narrower]
            })
            .flat()
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
  padding: 0;
  --ms-max-height: 300px;
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
