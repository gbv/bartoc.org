<template>
  <div>
    <!-- TODO: set registryCount and repositoryCount via Vue -->
    <p>
      BARTOC knows about <a href="/registries"><!--%= registryCount %--> terminology registries</a>,
      including itself.
      <!--%= repositoryCount %--> some registries
      also provide access to full terminologies
      either via an API (terminology <b>service</b>) or by other means
      (terminology <b>repository</b>).<sup><a href="#poster">*</a></sup>
    </p>

    <p>
      Registries can be filtered by function.
    </p>

    <div
      class="registry-list-filters mb-3"
      role="group"
      aria-label="Filter registries by function">
      <button
        v-for="filter in functionFilters"
        :key="filter.id"
        type="button"
        class="cc-button cc-button-primary mr-2 mb-2"
        :class="activeFilters[filter.id] ? 'cc-button-primary' : 'cc-button-ghost'"
        :title="filter.description"
        :aria-label="`${filter.title}: ${filter.description}`"
        :aria-pressed="activeFilters[filter.id] ? 'true' : 'false'"
        @click="toggleFilter(filter.id)">
        {{ filter.title }}
        <span class="badge badge-light">{{ filter.items.length }}</span>
      </button>
    </div>

    <table
      v-if="filteredRegistries.length"
      class="table table-borderless table-hover registry-list-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Function</th>
          <th>Description</th>
          <th class="registry-terminologies-count">
            Terminologies in BARTOC
          </th>
          <th>API</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="registry in filteredRegistries"
          :key="registry.uri">
          <td class="align-middle">
            <a :href="registryUrl(registry)">
              {{ registryLabel(registry) }}
            </a>
            <a
              v-if="registry.url"
              :href="registry.url"
              class="registry-homepage-link"
              :aria-label="`${registryLabel(registry)} homepage`"
              title="Homepage">
              <font-awesome-icon icon="arrow-up-right-from-square" />
            </a>
          </td>

          <td class="align-middle">
            {{ functionTitle(registry) }}
          </td>

          <td class="align-middle text-muted registry-description">
            {{ registryDescription(registry) }}
          </td>

          <td class="align-middle registry-terminologies-count">
            <span
              v-if="isTerminologyCountLoading(registry)"
              class="registry-count-loading"
              role="status"
              :aria-label="`Loading terminology count for ${registryLabel(registry)}`">
              <loading-indicator
                class="registry-count-loading-indicator"
                size="lg"
                aria-hidden="true" />
            </span>
            <a
              v-else
              :href="terminologiesUrl(registry)"
              :aria-label="`Show terminologies listed by ${registryLabel(registry)}`">
              {{ terminologiesLabel(registry) }}
            </a>
          </td>

          <td class="align-middle">
            <template v-if="registryApis(registry).length">
              <span
                v-for="(api, index) in registryApis(registry)"
                :key="apiKey(registry, api, index)">
                <br v-if="index">
                <a :href="api.url">
                  {{ apiLabel(api) }}
                </a>
              </span>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <p
      v-if="!filteredRegistries.length"
      class="text-muted">
      No registries found.
    </p>

    <hr>
    <p>
      <a
        href="/registries?format=jskos"
        class="cc-button cc-button-action">
        Download full list of registries
      </a>
      in JSKOS format.
    </p>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue"
import { library } from "@fortawesome/fontawesome-svg-core"
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { LoadingIndicator } from "jskos-vue"

library.add(faArrowUpRightFromSquare)

// Shared table settings.
const fullRepositoryType = "http://bartoc.org/full-repository"
const descriptionLength = 100
const apiTypeLabels = {
  jskos: "JSKOS API",
  noterms: "NoTerms API",
  ols: "OLS API",
  ontoportal: "OntoPortal API",
  reconciliation: "Reconciliation API",
  skohub: "SkoHub",
  skosmos: "Skosmos API",
  sparql: "SPARQL endpoint",
  tematres: "TemaTres API",
  webservice: "Web service",
  xtree: "xTree API",
}

const registries = ref([])
const pendingTerminologyCountUris = reactive(new Set())
const terminologyCountBatchSize = 5

fetch("/api/registries?limit=1000").then(res => res.json()).then(async res => {
  registries.value = res
  await loadTerminologyCounts()
})

// Show the registry list first. Then load terminology counts in small batches.
async function loadTerminologyCounts() {
  const pendingRegistries = registries.value.filter(registry =>
    !Number.isInteger(registry.COUNT),
  )

  pendingRegistries.forEach(registry => {
    pendingTerminologyCountUris.add(registry.uri)
  })

  for (let offset = 0; offset < pendingRegistries.length; offset += terminologyCountBatchSize) {
    const batch = pendingRegistries.slice(offset, offset + terminologyCountBatchSize)
    await Promise.all(batch.map(loadTerminologyCount))
  }
}

// Load the terminology count for one registry.
async function loadTerminologyCount(registry) {
  try {
    const params = new URLSearchParams({
      partOf: registry.uri,
      limit: "0",
    })

    // Request no rows: jskos-server still returns the total in X-Total-Count.
    const response = await fetch(`/api/voc?${params.toString()}`)
    const countHeader = response.headers?.get("X-Total-Count")

    if (countHeader === null || countHeader === undefined) {
      return
    }

    const count = Number(countHeader)
    if (Number.isInteger(count) && count >= 0) {
      registry.COUNT = count
    }
  } catch {
    // Keep the table usable if a single count request fails.
  } finally {
    pendingTerminologyCountUris.delete(registry.uri)
  }
}


// Small data helpers.
// Return API links for a registry.
function registryApis(registry) {
  return registry.API || []
}

// Pick the best label to show.
function registryLabel(registry) {
  return registry.prefLabel?.en ||
    Object.values(registry.prefLabel || {}).find(Boolean) ||
    registry.notation?.[0] ||
    registry.uri
}

// Build the local registry page URL.
function registryUrl(registry) {
  return `/en/node/${registry.uri.split("/").pop()}`
}

// Build the terminology search URL.
function terminologiesUrl(registry) {
  return `/vocabularies?${new URLSearchParams({ partOf: registry.uri }).toString()}`
}

// Show the count when it is loaded.
function terminologiesLabel(registry) {
  return Number.isInteger(registry.COUNT)
    ? registry.COUNT.toLocaleString()
    : "show"
}

// Check whether a registry count request is still pending.
function isTerminologyCountLoading(registry) {
  return pendingTerminologyCountUris.has(registry.uri)
}

// Build a stable key for API links.
function apiKey(registry, api, index) {
  return `${registry.uri}-${api.url || api.type || index}`
}

// Convert an API type URI into a short label.
function apiLabel(api) {
  const type = api.type?.split("/").pop()
  return apiTypeLabels[type] || type || "API"
}

// Sort registries by their display label.
function sortByLabel(items) {
  return [...items].sort((a, b) => registryLabel(a).localeCompare(registryLabel(b)))
}

// Registry function groups.
// Check whether a registry stores full terminologies.
function hasFullRepositoryType(registry) {
  return registry.type?.includes(fullRepositoryType)
}

// Return the filter id for a registry.
function registryFunction(registry) {
  if (!hasFullRepositoryType(registry)) {
    return "metadata-registries"
  }

  return registryApis(registry).length
    ? "terminology-services"
    : "terminology-repositories"
}


// Keep descriptions short in the table.
// Normalize and shorten text.
function abbreviateText(text) {
  const normalized = text.replace(/\s+/g, " ").trim().replace(/^"|"$/g, "")
  if (normalized.length <= descriptionLength) {
    return normalized
  }

  return `${normalized.slice(0, descriptionLength).trim()}...`
}

// Pick the English description text.
function registryDescription(registry) {
  const description = registry.definition?.en?.[0] || registry.scopeNote?.en?.[0] || ""
  return description ? abbreviateText(description) : ""
}

// Toggle state for the table filters.
const activeFilters = reactive({
  "metadata-registries": true,
  "terminology-services": true,
  "terminology-repositories": true,
})

const functionFilters = computed(() => [
  {
    id: "metadata-registries",
    title: "Metadata Registries",
    label: "metadata registry",
    description: "List and describe terminologies.",
  },
  {
    id: "terminology-services",
    title: "Terminology Services",
    label: "terminology service",
    description: "Provide access to terminologies via an API.",
  },
  {
    id: "terminology-repositories",
    title: "Terminology Repositories",
    label: "terminology repository",
    description: "Contain full terminologies.",
  },
].map(filter => ({
  ...filter,
  items: sortByLabel(registries.value.filter(registry =>
    registryFunction(registry) === filter.id,
  )),
})))

// Find the filter metadata for a registry.
function functionFilter(registry) {
  const functionId = registryFunction(registry)
  return functionFilters.value.find(filter => filter.id === functionId)
}

// Return the label shown in the Function column.
function functionTitle(registry) {
  return functionFilter(registry)?.label || ""
}

// Toggle one table filter.
function toggleFilter(id) {
  activeFilters[id] = !activeFilters[id]
}

const filteredRegistries = computed(() =>
  sortByLabel(registries.value.filter(registry =>
    activeFilters[registryFunction(registry)],
  )),
)
</script>

<style scoped>
.registry-list-table th,
.registry-list-table td {
  vertical-align: middle;
}

.registry-homepage-link {
  display: inline-block;
  margin-left: var(--cc-space-sm);
  font-size: 0.875em;
}

.registry-description {
  max-width: 30rem;
}

.registry-terminologies-count {
  text-align: center;
}

.registry-count-loading-indicator {
  --jskos-vue-loadingIndicator-primary-color: var(--cc-color-on-primary);
  --jskos-vue-loadingIndicator-secondary-color: var(--cc-color-primary);
}

.badge {
  margin-left: 0.4rem;
}

</style>
