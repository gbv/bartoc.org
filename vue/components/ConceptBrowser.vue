<template>
  <div v-if="source">
    <div class="cc-concept-controls">
      <div class="cc-concept-field cc-concept-field--search">
        <label
          v-if="!sourceError && source.registry.has.suggest"
          class="cc-concept-search-label">
          <span>Search</span>
          <ItemSelect
            :search="searchConcepts"
            placeholder="Search concepts…"
            @select="selectConcept" />
        </label>
        <template v-else>
          <span class="cc-concept-field-label">Search</span>
          <span>{{ sourceError ? "Terminology search unavailable" : "Terminology search not supported" }}</span>
        </template>
      </div>
      <!-- One terminology may provide the same concepts through several APIs. -->
      <div class="cc-concept-field cc-concept-field--source">
        <label
          v-if="sourceOptions.length > 1"
          for="concept-api">
          Data source
        </label>
        <span
          v-else
          class="cc-concept-field-label">
          Data source
        </span>
        <select
          v-if="sourceOptions.length > 1"
          id="concept-api"
          class="cc-form-control"
          :value="selectedSourceIndex ?? source.option.index"
          :disabled="loadingSource"
          @change="changeSource">
          <option
            v-for="option in sourceOptions"
            :key="option.index"
            :value="option.index"
            :disabled="!option.supported"
            :title="option.endpoint.url">
            {{ sourceOptionLabel(option) }}
          </option>
        </select>
        <span
          v-else
          class="cc-concept-source-name"
          :title="source.option.endpoint.url">
          {{ sourceOptionLabel(source.option) }}
        </span>
        <small
          v-if="sourceOptions.length > 1"
          class="cc-concept-help">
          Results may differ between sources.
        </small>
      </div>
    </div>
    <p
      v-if="sourceError || conceptError"
      class="cc-form-feedback--invalid"
      role="alert">
      {{ sourceError || conceptError }}
    </p>
    <!-- Keep the concept tree visible while reading the selected concept. -->
    <div
      v-if="showContent && (source.concepts.length || showDetails)"
      :class="{ 'cc-concept-workspace--split': source.concepts.length && showDetails }">
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
        v-if="showDetails"
        class="cc-concept-panel"
        :class="{ 'cc-concept-panel--details-only': !source.concepts.length }">
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
import jskos from "jskos-tools"
import ConceptDetails from "./ConceptDetails.vue"
import ServiceLink from "./ServiceLink.vue"
import { apiTypesScheme, registryForScheme, sortConcepts } from "../utils.js"

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

// True after the first source check has finished.
const initialized = ref(false)

// Hide old content while a source is being checked.
const loadingSource = ref(false)

// The dropdown can show a failed source while the last working source stays loaded.
const selectedSourceIndex = ref(null)

// A source error means that the selected API cannot load this vocabulary.
const sourceError = ref("")

// A concept error means that the API works but cannot return the requested concept.
const conceptError = ref("")

// Readable labels for the API type URIs stored in the terminology record.
const apiTypeLabels = ref({})

// Display options defined by the terminology.
const display = computed(() => props.scheme.DISPLAY || {})

// Do not show content from the previous source while another source fails or loads.
const showContent = computed(() => !loadingSource.value && !sourceError.value)
const showDetails = computed(() => showContent.value && selected.value?.uri && !conceptError.value)

// Keep unsupported endpoints visible so users can see every registered source.
const sourceOptions = computed(() => (props.scheme.API || [])
  .map((endpoint, index) => ({
    endpoint,
    index,
    label: endpointLabel(endpoint, index),
    supported: Boolean(registryForScheme(schemeForEndpoint(props.scheme.uri, endpoint))),
  }))
  // List usable sources first while keeping the registered order in each group.
  .sort((first, second) => Number(second.supported) - Number(first.supported)))

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
async function searchConcepts(search) {
  const [query, labels = [], descriptions = [], uris = []] = await source.value.registry.suggest({
    search,
    scheme: source.value.scheme,
  })

  // Keep all OpenSearch Suggest columns aligned when an API omits descriptions.
  return [
    query,
    labels,
    labels.map((_, index) => descriptions[index] || ""),
    uris,
  ]
}

// Remove the protocol and trailing slash to make source names easier to scan.
function endpointLabel(endpoint, index) {
  return endpoint.url?.replace(/^https?:\/\//, "").replace(/\/$/, "")
    || endpoint.type
    || `API ${index + 1}`
}

// Combine the endpoint address with its registered API type and support status.
function sourceOptionLabel(option) {
  const apiType = apiTypeLabels.value[option.endpoint.type]
  const type = apiType ? ` (${apiType})` : ""
  const status = option.supported ? "" : " — Not supported"

  return `${option.label}${type}${status}`
}

// API entries contain type URIs. Resolve their readable labels from BARTOC.
async function loadApiTypeLabels() {
  const registry = registryForScheme(apiTypesScheme)
  const types = [...new Set(
    (props.scheme.API || []).map(endpoint => endpoint.type).filter(Boolean),
  )]

  if (!registry || !types.length) {
    return
  }

  const concepts = await registry.getConcepts({
    concepts: types.map(uri => ({ uri })),
  }).catch(() => [])

  apiTypeLabels.value = Object.fromEntries(
    concepts.map(concept => [concept.uri, jskos.prefLabel(concept)]),
  )
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

// Load a concept from the active source before showing its details.
async function selectConceptFromSource(uri) {
  const reference = { uri, inScheme: [source.value.scheme] }
  const concepts = await source.value.registry
    .getConcepts({ concepts: [reference] })
    .catch(() => null)

  if (!concepts?.[0]) {
    selected.value = null
    conceptError.value = "This concept was not found in the selected data source."
    return
  }

  conceptError.value = ""
  await selectConcept(concepts[0])
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

    // Initialize the provider before checking which API features are available.
    try {
      await registry.init()
    } catch {
      continue
    }

    if (!registry.has.suggest && !registry.has.top) {
      continue
    }

    // Search-only APIs do not provide top concepts for a tree.
    const concepts = registry.has.top
      ? await registry.getTop({ scheme }).catch(() => null)
      : []

    // A failed URI may be known by another identifier.
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
  conceptError.value = ""

  try {
    const nextSource = await findSource(option)

    if (!nextSource) {
      return null
    }

    const selectedUri = selected.value?.uri
    source.value = nextSource
    selectedSourceIndex.value = option.index

    if (selectedUri) {
      // Reload details because another source may return different data.
      await selectConceptFromSource(selectedUri)
    }

    return nextSource
  } finally {
    loadingSource.value = false
  }
}

// Keep the previous endpoint if the new one cannot load the scheme.
async function changeSource(event) {
  const option = sourceOptions.value.find(({ index }) => index === Number(event.target.value))

  if (!option) {
    return
  }

  // Keep the requested source selected even if it cannot load the vocabulary.
  selectedSourceIndex.value = option.index
  updateSourceUrl(option)

  // Keep the current source when the new one cannot load the vocabulary.
  if (!await activateSource(option)) {
    sourceError.value = `The data source ${option.label} cannot browse this vocabulary.`
    return
  }
}

// Store the endpoint URL so a shared link can open the same data source.
function updateSourceUrl(option) {
  const url = new URL(window.location.href)
  url.searchParams.set("source", option.endpoint.url)
  window.history.replaceState({}, "", url)
}

// Keep the selected concept in the URL without adding browser history entries.
function updateConceptUrl(concept) {
  const url = new URL(window.location.href)

  if (concept?.uri) {
    url.searchParams.set("uri", concept.uri)
    if (sourceOptions.value.length > 1) {
      url.searchParams.set("source", source.value.option.endpoint.url)
    }
  } else {
    url.searchParams.delete("uri")
  }

  window.history.replaceState({}, "", url)
}

watch(selected, concept => {
  if (concept?.uri) {
    conceptError.value = ""
  }
  updateConceptUrl(concept)
})

onMounted(async () => {
  loadApiTypeLabels()

  // Read the selected concept and data source from the URL.
  const urlParams = new URLSearchParams(window.location.search)
  const selectedUri = urlParams.get("uri")
  const requestedSource = urlParams.get("source")
  const requestedOption = sourceOptions.value.find(
    option => option.endpoint.url === requestedSource,
  )
  const supportedOptions = sourceOptions.value.filter(option => option.supported)
  const options = requestedOption?.supported
    ? [requestedOption, ...supportedOptions.filter(option => option !== requestedOption)]
    : supportedOptions

  try {
    // Try the requested endpoint first, then fall back to other working sources.
    for (const option of options) {
      if (await activateSource(option)) {
        if (selectedUri) {
          await selectConceptFromSource(selectedUri)
        }
        if (requestedSource && option.endpoint.url !== requestedSource) {
          updateSourceUrl(option)
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
  flex: 0 1 22rem;
}
.cc-concept-field--source > label,
.cc-concept-field-label,
.cc-concept-search-label > span {
  display: block;
  margin-bottom: var(--cc-space-xs);
  font-weight: var(--cc-font-weight-bold);
}
.cc-concept-search-label {
  display: block;
}
.cc-concept-field--search :deep(.jskos-vue-itemSuggest) {
  height: auto;
}
.cc-concept-field--search :deep(.jskos-vue-itemSuggest > input) {
  box-sizing: border-box;
  min-height: 2.375rem;
  padding: .375rem .75rem;
  border: 1px solid var(--cc-border-color-control);
  border-radius: var(--cc-radius-sm);
  font-size: var(--cc-font-size-base);
  line-height: 1.5;
}
.cc-concept-help {
  display: block;
  margin-top: var(--cc-space-xs);
}
.cc-concept-source-name {
  display: block;
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
.cc-concept-panel--details-only {
  width: 50%;
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
  border: 1px solid var(--cc-border-color-strong);
  background: var(--cc-color-surface);
}
.cc-concept-workspace--split .cc-concept-panel + .cc-concept-panel .cc-concept-details {
  border-left: 0;
}
</style>
