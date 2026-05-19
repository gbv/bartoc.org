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
    :placeholder="placeholder"
    @change="emit('update:modelValue', $event)" />
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
    :placeholder="placeholder"
    @change="emit('update:modelValue', $event)" />
</template>

<script setup>
import { computed, ref, watch } from "vue"
import Multiselect from "@vueform/multiselect"
import jskos from "jskos-tools"
import { registryForScheme, sortConcepts } from "../utils.js"

// Select one or a list of item URIs
const props = defineProps({
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
  placeholder: {
    type: String,
    default: "Search…",
  },
})

const emit = defineEmits(["update:modelValue"])

const multiselect = ref(null)
const value = ref(props.modelValue || (props.repeatable ? [] : null))
const isLoading = ref(false)
const cancel = ref(null)

const registry = computed(() => registryForScheme(props.scheme))
const options = computed(() => registry.value ? search : (props.scheme.concepts || []))

watch(
  () => props.modelValue,
  (newValue) => {
    value.value = newValue || (props.repeatable ? [] : "")
  },
  { immediate: true },
)

async function search(query) {
  if (!registry.value) {
    return []
  }

  isLoading.value = true
  // cancel previous request if necessary
  cancel.value && cancel.value("canceled")

  let promise
  if (query) {
    promise = registry.value.search({ search: query, scheme: props.scheme })
  } else {
    const params = props.depth > 1 ? { properties: "*" } : null
    promise = registry.value.getTop({ scheme: props.scheme, params })
    // TODO: support more then 2 levels or better use another component for hierarchy browsing?
  }
  cancel.value = promise.cancel

  let results = []
  try {
    results = await promise
    // for top concepts, sort them
    if (!query) {
      results = sortConcepts(results, props.scheme)
        // add direct child concepts in between
        .map(({ narrower, ...concept }) => {
          narrower = (narrower || []).filter(Boolean).map(
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

  cancel.value = null
  isLoading.value = false

  return results.map(c => ({
    value: props.extractValue(c), label: props.extractLabel(c),
  }))
}

function focus() {
  const input = multiselect.value && multiselect.value.input
  input && input.focus()
}

defineExpose({ focus })
</script>

<style src="@vueform/multiselect/themes/default.css"></style>
<style>
/* Adjust for Bootstrap CSS */
div.multiselect {
  padding: 0;
  --ms-max-height: 300px;
}
div.multiselect-input, div.multiselect-options {
  border: 1px solid var(--cc-border-color-control);
}
div.multiselect-options {
  overflow-x: hidden;
}
div.multiselect.form-control {
  height: inherit;
}
</style>
