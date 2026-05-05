<template>
  <div>
    <p>
      Registries are grouped by function.
    </p>

    <nav class="registry-list-nav">
      <a
        v-for="group in groups"
        :key="group.id"
        :href="`#${group.id}`"
        class="btn btn-outline-secondary btn-sm">
        {{ group.title }}
        <span class="badge badge-light">{{ group.items.length }}</span>
      </a>
    </nav>

    <section
      v-for="group in groups"
      :id="group.id"
      :key="group.id"
      class="registry-group">
      <h2>{{ group.title }}</h2>
      <p class="text-muted">
        {{ group.description }}
      </p>

      <table class="table table-borderless table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Homepage</th>
            <th>API / Service links</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="registry in group.items"
            :key="registry.uri">
            <td class="align-middle">
              <a :href="registryUrl(registry)">
                {{ registryLabel(registry) }}
              </a>
            </td>

            <td class="align-middle">
              <a
                v-if="registry.url"
                :href="registry.url"
                :aria-label="`${registryLabel(registry)} homepage`"
                title="Homepage">
                Homepage
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
    </section>

    <p
      v-if="!groups.length"
      class="text-muted">
      No registries found.
    </p>
  </div>
</template>

<script setup>
import { computed } from "vue"

const fullRepositoryType = "http://bartoc.org/full-repository"
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

const props = defineProps({
  registries: {
    type: Array,
    default: () => [],
  },
})

function hasFullRepositoryType(registry) {
  return registry.type?.includes(fullRepositoryType)
}

function registryApis(registry) {
  return registry.API || []
}

function isTerminologyService(registry) {
  return hasFullRepositoryType(registry) && registryApis(registry).length
}

function isTerminologyRepository(registry) {
  return hasFullRepositoryType(registry) && !registryApis(registry).length
}

function isMetadataRegistry(registry) {
  return !hasFullRepositoryType(registry)
}

function registryLabel(registry) {
  return registry.prefLabel?.en ||
    Object.values(registry.prefLabel || {}).find(Boolean) ||
    registry.notation?.[0] ||
    registry.uri
}

function registryUrl(registry) {
  return `/en/node/${registry.uri.split("/").pop()}`
}

function apiKey(registry, api, index) {
  return `${registry.uri}-${api.url || api.type || index}`
}

function apiLabel(api) {
  const type = api.type?.split("/").pop()
  return apiTypeLabels[type] || type || "API"
}

function sortByLabel(items) {
  return [...items].sort((a, b) => registryLabel(a).localeCompare(registryLabel(b)))
}

const groups = computed(() => ([
  {
    id: "metadata-registries",
    title: "Metadata Registries",
    description: "Metadata registries list and describe terminologies.",
    items: sortByLabel(props.registries.filter(isMetadataRegistry)),
  },
  {
    id: "terminology-services",
    title: "Terminology Services",
    description: "Terminology services provide access to terminologies via an API.",
    items: sortByLabel(props.registries.filter(isTerminologyService)),
  },
  {
    id: "terminology-repositories",
    title: "Terminology Repositories",
    description: "Terminology repositories contain full terminologies.",
    items: sortByLabel(props.registries.filter(isTerminologyRepository)),
  },
]).filter(group => group.items.length))
</script>

<style scoped>
.registry-list-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0 1.5rem;
}

.registry-group {
  scroll-margin-top: 1rem;
  margin-bottom: 2rem;
}
</style>
