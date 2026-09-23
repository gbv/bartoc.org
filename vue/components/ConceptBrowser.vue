<template>
  <div v-if="source">
    <h3>Explore vocabulary</h3>
    <div class="cc-concept-controls">
      <div class="cc-concept-field cc-concept-field--search">
        <label class="cc-concept-search-label">
          <span>Search</span>
          <ItemSelect
            :search="searchConcepts"
            placeholder="Search concepts…"
            @select="selectConcept" />
        </label>
      </div>
      <!-- One terminology may provide the same concepts through several APIs. -->
      <div
        v-if="sourceOptions.length > 1"
        class="cc-concept-field cc-concept-field--source">
        <label for="concept-api">Data source</label>
        <select
          id="concept-api"
          class="cc-form-control"
          :value="source.option.index"
          :disabled="loadingSource"
          @change="changeSource">
          <option
            v-for="option in sourceOptions"
            :key="option.index"
            :value="option.index"
            :title="option.endpoint.url">
            {{ option.label }}
          </option>
        </select>
        <small class="cc-concept-help">Results may differ between sources.</small>
      </div>
    </div>
    <p
      v-if="sourceError"
      class="cc-form-feedback--invalid"
      role="alert">
      {{ sourceError }}
    </p>
    <!-- Keep the concept tree visible while reading the selected concept. -->
    <div
      v-if="source.concepts.length || selected?.uri"
      :class="{ 'cc-concept-workspace--split': source.concepts.length && selected?.uri }">
      <section
        v-if="source.concepts.length"
        class="cc-concept-panel">
        <h4>Browse concepts</h4>
        <ConceptTree
          :key="source.option.index"
          ref="conceptTree"
          v-model="selected"
          class="cc-concept-tree"
          :concepts="source.concepts"
          :registry="source.registry"
          :scheme="source.scheme"
          :item-list-options="treeOptions" />
      </section>
      <section
        v-if="selected?.uri"
        class="cc-concept-panel">
        <h4>Concept details</h4>
        <div class="cc-concept-details">
          <ConceptDetails
            :concept="selected"
            :scheme="source.scheme"
            :display="display"
            :registry="source.registry"
            @update:concept="selectConcept" />
        </div>
      </section>
    </div>
  </div>
  <div v-else-if="initialized && (scheme.API || []).length">
    <p>
      Access to this repository is possible via APIs
      but inclusion in BARTOC has not been implemented yet:
    </p>
    <ul>
      <li
        v-for="endpoint in scheme.API"
        :key="endpoint.url">
        <ServiceLink
          :scheme="scheme"
          :endpoint="endpoint" />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, shallowRef, watch } from "vue"
import { ConceptTree, ItemSelect } from "jskos-vue"
import ConceptDetails from "./ConceptDetails.vue"
import ServiceLink from "./ServiceLink.vue"
import { registryForScheme, sortConcepts } from "../utils.js"

const props = defineProps({
  scheme: {
    type: Object,
    required: true,
  },
})

// Active API source and its vocabulary data.
const source = shallowRef(null)

// ConceptTree component instance.
const conceptTree = ref(null)

// Currently selected concept.
const selected = ref(null)

// State of API source loading.
const initialized = ref(false)
const loadingSource = ref(false)
const sourceError = ref("")

// Display options defined by the terminology.
const display = computed(() => props.scheme.DISPLAY || {})

// Only show endpoints for which cocoda-sdk has a concept provider.
const sourceOptions = computed(() => (props.scheme.API || [])
  .map((endpoint, index) => ({
    endpoint,
    index,
    label: endpointLabel(endpoint, index),
  }))
  .filter(({ endpoint }) => registryForScheme(schemeForEndpoint(props.scheme.uri, endpoint))))

// Disable drag and drop in both the tree and its items.
// Show concept notations unless the terminology asks to hide them.
const treeOptions = computed(() => ({
  draggable: false,
  itemNameOptions: {
    draggable: false,
    showNotation: !display.value.hideNotation,
  },
}))

// ItemSelect only receives search, so it does not add another concept tree.
function searchConcepts(search) {
  return source.value.registry.suggest({
    search,
    scheme: source.value.scheme,
  })
}

// Remove the protocol and trailing slash to make source names easier to scan.
function endpointLabel(endpoint, index) {
  return endpoint.url?.replace(/^https?:\/\//, "").replace(/\/$/, "")
    || endpoint.type
    || `API ${index + 1}`
}

// A concept can be selected outside the tree, for example from search results,
// the details panel, or the page URL.
// Update the selection first, then open the concept and its hierarchy in ConceptTree.
async function selectConcept(concept) {
  selected.value = concept

  if (concept?.uri) {
    await nextTick()
    await conceptTree.value?.navigateToUri(concept)
  }
}

// Allow the parent page to clear the selection when leaving the Content tab.
defineExpose({ selectConcept })

// Give cocoda-sdk one API entry so it cannot select a different endpoint.
// Remove a cached registry because it may belong to another endpoint.
function schemeForEndpoint(uri, endpoint) {
  const scheme = { ...props.scheme, uri, API: [endpoint] }
  delete scheme._registry
  return scheme
}

// A service may know the scheme by its main URI or by an identifier.
// Try each URI until the selected endpoint accepts one.
async function findSource(option) {
  const possibleUris = [props.scheme.uri, ...(props.scheme.identifier || [])]

  for (const uri of possibleUris) {
    const scheme = schemeForEndpoint(uri, option.endpoint)
    const registry = registryForScheme(scheme)

    if (!registry) {
      continue
    }

    // A failed URI may be known by another identifier.
    const concepts = await registry.getTop({ scheme }).catch(() => null)
    if (!concepts) {
      continue
    }

    // Some providers need their local vocabulary ID for later requests.
    scheme.VOCID = registry._jskos?.schemes?.[0]?.VOCID
    sortConcepts(concepts, props.scheme)

    return {
      option,
      registry,
      scheme,
      // A new array makes ConceptTree reset its top concepts.
      concepts: [...concepts],
    }
  }

  return null
}

// Find the source before replacing the current browser data.
async function activateSource(option) {
  loadingSource.value = true
  sourceError.value = ""

  try {
    const nextSource = await findSource(option)

    if (!nextSource) {
      return null
    }

    const selectedUri = selected.value?.uri
    source.value = nextSource

    if (selectedUri) {
      // Reload details because another source may return different data.
      await selectConcept({
        uri: selectedUri,
        inScheme: [nextSource.scheme],
      })
    }

    return nextSource
  } finally {
    loadingSource.value = false
  }
}

// Keep the previous endpoint if the new one cannot load the scheme.
async function changeSource(event) {
  const option = sourceOptions.value.find(({ index }) => index === Number(event.target.value))

  if (option && !await activateSource(option)) {
    sourceError.value = "This API cannot browse the vocabulary."
    event.target.value = source.value.option.index
  }
}

// Keep the selected concept in the URL without adding browser history entries.
function updateConceptUrl(concept) {
  const url = new URL(window.location.href)

  if (concept?.uri) {
    url.searchParams.set("uri", concept.uri)
  } else {
    url.searchParams.delete("uri")
  }

  window.history.replaceState({}, "", url)
}

watch(selected, updateConceptUrl)

onMounted(async () => {
  // Get URI for selected concept from URL
  const urlParams = new URLSearchParams(window.location.search)
  const selectedUri = urlParams.get("uri")

  try {
    // Use the first endpoint that accepts the scheme or one of its identifiers.
    for (const option of sourceOptions.value) {
      if (await activateSource(option)) {
        if (selectedUri) {
          await selectConcept({
            uri: selectedUri,
            inScheme: [source.value.scheme],
          })
        }
        break
      }
    }
  } finally {
    // Do not show the API fallback while the first source is still loading.
    initialized.value = true
  }
})
</script>

<style scoped>
h4 {
  padding-top: var(--cc-row-padding-x);
}
.cc-concept-field {
  max-width: 30rem;
  margin-bottom: var(--cc-space-md);
}
.cc-concept-controls {
  display: flex;
  justify-content: space-between;
  gap: var(--cc-space-md);
}
.cc-concept-field--search {
  flex: 0 1 50%;
  max-width: 50%;
}
.cc-concept-field--source {
  flex: 0 1 30rem;
}
.cc-concept-field--source > label,
.cc-concept-search-label > span {
  display: block;
  margin-bottom: var(--cc-space-xs);
  font-weight: var(--cc-font-weight-bold);
}
.cc-concept-search-label {
  display: block;
}
.cc-concept-help {
  display: block;
  margin-top: var(--cc-space-xs);
}
.cc-concept-workspace--split {
  display: flex;
}
.cc-concept-panel {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-width: 0;
}
.cc-concept-tree {
  flex: 1 1 auto;
  max-height: 32rem;
  overflow-y: auto;
}
.cc-concept-details {
  flex: 1 1 auto;
  padding: var(--cc-space-sm);
}
.cc-concept-tree,
.cc-concept-details {
  border: 1px solid var(--cc-border-color);
}
.cc-concept-workspace--split .cc-concept-panel + .cc-concept-panel .cc-concept-details {
  border-left: 0;
}
</style>
