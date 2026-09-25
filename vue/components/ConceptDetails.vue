<template>
  <p
    v-if="loading"
    class="cc-concept-loading"
    role="status">
    <LoadingIndicator size="lg" />
    Loading concept details…
  </p>
  <p
    v-if="!loading && loadError"
    class="cc-form-feedback--invalid"
    role="alert">
    {{ loadError }}
    <button
      type="button"
      class="cc-button cc-button-secondary cc-button-sm"
      @click="loadConcept(concept)">
      Retry
    </button>
  </p>
  <ItemDetails
    v-if="!loading && item?.uri"
    class="cc-concept-item-details"
    :class="{ 'cc-concept-item-details--hide-notation': display.hideNotation }"
    :item="item"
    flat
    :dropzone="false"
    :draggable="false"
    :fields="detailFields"
    :item-list-options="itemListOptions"
    :show-ancestors="false"
    :show-broader="false"
    :show-narrower="false"
    @select="emit('update:concept', $event.item)">
    <template #afterName>
      <a
        v-if="k10plus"
        :href="k10plus"
        class="cc-concept-catalog-link"
        title="search in K10plus library catalog"
        target="k10plus">📚</a>
    </template>
    <template #afterTabs>
      <ItemNotes
        :item="item"
        :properties="additionalProperties" />
      <!-- Show the hierarchy after the metadata with clear relation labels. -->
      <section
        v-if="broaderConcepts.length"
        class="cc-concept-relations cc-concept-broader">
        <h5>{{ broaderConcepts.length === 1 ? "Broader concept" : "Broader concepts" }}</h5>
        <ItemList
          v-bind="itemListOptions"
          :items="broaderConcepts"
          @select="emit('update:concept', $event.item)" />
      </section>
      <section
        v-if="narrowerConcepts.length"
        class="cc-concept-relations cc-concept-narrower">
        <h5>Narrower concepts</h5>
        <ItemList
          v-bind="itemListOptions"
          :items="narrowerConcepts"
          @select="emit('update:concept', $event.item)" />
      </section>
    </template>
  </ItemDetails>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import { ItemDetails, ItemList, LoadingIndicator } from "jskos-vue"
import ItemNotes from "./ItemNotes.vue"
import { sortConcepts } from "../utils.js"
import k10plusikt from "../../data/k10plus-ikt.json"

const props = defineProps({
  concept: {
    type: Object,
    required: true,
  },
  registry: {
    type: Object,
    required: true,
  },
  scheme: {
    type: Object,
    required: true,
  },
  display: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(["update:concept"])

// Stop waiting before cocoda-sdk's longer network timeout.
const detailsTimeout = 30000

const item = ref(null)
const loading = ref(false)
const loadError = ref("")

// Each request gets an ID so late responses can be ignored.
let loadId = 0

// The preferred label is already shown as the details heading.
const detailFields = { prefLabel: false }

// ItemDetails does not render these JSKOS language maps.
const additionalProperties = [
  "hiddenLabel",
  "note",
  "historyNote",
  "changeNote",
  "example",
]

// Show the full path without repeating broader concepts returned separately.
const broaderConcepts = computed(() => {
  const ancestors = (item.value?.ancestors || []).filter(Boolean)
  const broader = (item.value?.broader || [])
    .filter(concept => (
      concept && !ancestors.some(ancestor => ancestor.uri === concept.uri)
    ))

  return [...ancestors].reverse().concat(broader)
})

const narrowerConcepts = computed(() => item.value?.narrower || [])

// Disable drag and drop and follow the terminology notation setting.
const itemListOptions = computed(() => ({
  draggable: false,
  itemNameOptions: {
    draggable: false,
    showNotation: !props.display.hideNotation,
  },
}))

// Build a catalog search link when the scheme supports it.
const k10plus = computed(() => {
  const notation = item.value?.notation?.[0]
  const ikt = k10plusikt[(props.scheme.CQLKEY || "").toUpperCase()]

  return ikt && notation
    ? `https://opac.k10plus.de/DB=2.299/CMD?ACT=SRCHA&IKT=${ikt}&TRM=${notation}`
    : null
})

// Load the complete concept and the relations supported by the API.
async function requestConcept(concept) {
  const registry = props.registry
  const scheme = props.scheme

  // Some providers need the active scheme to resolve and load the concept.
  const reference = {
    ...concept,
    inScheme: [scheme],
  }

  const [details] = await registry.getConcepts({ concepts: [reference] })

  // Ensure the concept has its scheme context before asking the provider for details.
  const loaded = {
    ...reference,
    ...(details || {}),
    inScheme: [scheme],
  }

  // Use embedded relations when an API has no hierarchy endpoints.
  // Also keep them as a fallback when a hierarchy request fails.
  const [ancestors, narrower] = await Promise.all([
    registry.has?.ancestors === false
      ? loaded.ancestors || []
      : registry.getAncestors({ concept: loaded }).catch(() => loaded.ancestors || []),
    registry.has?.narrower === false
      ? loaded.narrower || []
      : registry.getNarrower({ concept: loaded }).catch(() => loaded.narrower || []),
  ])

  return {
    ...loaded,
    ancestors,
    narrower: sortConcepts(narrower, scheme),
  }
}

// Stop updating the UI when a request takes too long.
// The SDK request keeps running because cancelling it currently causes an error.
function withTimeout(promise) {
  let timeout

  // Reject the promise after a timeout.
  const expired = new Promise((_, reject) => {
    timeout = setTimeout(reject, detailsTimeout)
  })

  // Use the first result: the API response or the timeout error.
  // Promise.race does not cancel the request that is still running.
  return Promise.race([promise, expired])
    .finally(() => clearTimeout(timeout))
}

// Do not let an older response replace a newer selection.
async function loadConcept(concept) {
  const currentLoad = ++loadId

  // Keep the small search result in case loading fails.
  item.value = concept
  loading.value = Boolean(concept?.uri)
  loadError.value = ""

  if (!concept?.uri) {
    return
  }

  try {
    const loaded = await withTimeout(requestConcept(concept))

    // The user may have selected another concept while this request was running.
    if (currentLoad === loadId) {
      item.value = loaded
    }
  } catch {
    if (currentLoad === loadId) {
      loadError.value = "Concept details could not be loaded."
    }
  } finally {
    if (currentLoad === loadId) {
      loading.value = false
    }
  }
}

// Reload the item when the parent browser selects another concept.
watch(
  () => props.concept,
  loadConcept,
  { immediate: true },
)
</script>

<style scoped>
.cc-concept-item-details {
  --jskos-vue-fontSize-small: var(--cc-font-size-base);
}
.cc-concept-loading {
  display: flex;
  align-items: center;
  gap: var(--cc-space-xs);
}
.cc-concept-item-details :deep(.jskos-vue-itemDetails-list) {
  padding-left: 0;
  list-style: none;
}
.cc-concept-catalog-link {
  padding-left: var(--cc-space-sm);
}
.cc-concept-relations {
  margin-top: var(--cc-space-md);
}
.cc-concept-relations h5 {
  margin-bottom: var(--cc-space-xs);
  font-size: var(--cc-font-size-base);
  font-weight: var(--cc-font-weight-bold);
}
.cc-concept-item-details--hide-notation :deep(.jskos-vue-itemDetails-name .jskos-vue-itemName-notation) {
  display: none;
}
</style>
