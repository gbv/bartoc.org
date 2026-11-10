<template>
  <a
    v-if="!isRegistry && userCanEdit"
    class="cc-button cc-button-primary page-action"
    :href="`/edit?uri=${encodeURIComponent(item.uri)}`">
    edit
  </a>
  <h1>{{ title }}</h1>
  <p v-if="isRegistry">
    <template v-if="isFullRepository">
      A {{ item.API?.length ? "service" : "repository" }} that stores terminologies.
    </template>
    <template v-else>
      A collection that references terminologies.
    </template>
  </p>
  <p
    v-else-if="versionOfReference"
    data-testid="version-context">
    <template v-if="currentVersionNumber">
      This is edition <strong>{{ currentVersionNumber }}</strong> of
    </template>
    <template v-else>
      This is an edition of
    </template>
    <ItemLink :item="versionOfReference" />.
    <span
      v-if="hasInheritedFields"
      :id="INHERITANCE_LEGEND_ID"
      class="version-inheritance-legend"
      data-testid="version-inheritance-legend">
      Values derived from the main record are marked with
      <i
        class="fas fa-code-branch version-inheritance-marker"
        aria-hidden="true" />
    </span>
  </p>

  <Tabs
    v-model="activeTab"
    active-color="var(--cc-color-primary)"
    @change="changeTab">
    <template #title="{ tab }">
      <i
        v-if="tab.title === 'Editions'"
        class="fas fa-code-branch"
        title="Derived from the main record"
        aria-hidden="true" />
      {{ tab.title }}
    </template>
    <Tab title="About">
      <ItemAbout
        :item="item"
        :is-registry="isRegistry"
        :nkos-types="nkosTypes"
        :current-version-number="currentVersionNumber"
        :definition-inherited="definitionInherited"
        :inheritance-legend-id="INHERITANCE_LEGEND_ID" />
    </Tab>

    <Tab
      title="Access">
      <ItemAccess
        :item="item"
        :is-registry="isRegistry" />
    </Tab>

    <Tab
      title="Identifiers">
      <ItemIdentifiers
        :item="item"
        :is-registry="isRegistry" />
    </Tab>

    <Tab
      v-if="!isRegistry && item.API?.length"
      title="Content">
      <ConceptBrowser
        :scheme="conceptScheme" />
    </Tab>

    <Tab
      v-if="!isRegistry && hasEditions"
      title="Editions">
      <ul class="terminology-editions">
        <li
          v-for="edition in editionRecords"
          :key="edition.uri">
          <EditionLink
            :edition-record="edition"
            :main-record="item" />
        </li>
      </ul>
    </Tab>
    <Tab
      v-if="!isRegistry && renderQualityTab"
      title="Metadata Quality"
      :hidden="!qualityTabAvailable">
      <p
        v-if="qualityTabLoading"
        class="metadata-quality-loading"
        role="status">
        Loading metadata quality…
      </p>
      <ItemQuality
        v-if="userCanEdit"
        :item="item"
        @count="qualitySummary = $event" />
    </Tab>
    <Tab
      v-if="isRegistry"
      :title="registryTerminologiesTitle">
      <RegistryVocabularies
        :registry-uri="item.uri"
        @count="registryTerminologyCount = $event" />
    </Tab>
  </Tabs>
  <ItemDates :item="item" />
</template>

<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, ref, unref, watch } from "vue"
import { Tab, Tabs } from "jskos-vue-tabs"
import "jskos-vue-tabs/dist/style.css"
import {
  hasValidVersionOf,
  sortEditionRecordsByStartDate,
  versionNumber,
} from "../../src/editions.js"
import ConceptBrowser from "../components/ConceptBrowser.vue"
import EditionLink from "../components/EditionLink.vue"
import ItemAbout from "../components/ItemAbout.vue"
import ItemAccess from "../components/ItemAccess.vue"
import ItemDates from "../components/ItemDates.vue"
import ItemIdentifiers from "../components/ItemIdentifiers.vue"
import ItemLink from "../components/ItemLink.vue"
import ItemQuality from "../components/ItemQuality.vue"
import RegistryVocabularies from "../components/RegistryVocabularies.vue"

defineOptions({ name: "ItemPage" })

const INHERITANCE_LEGEND_ID = "version-inheritance-legend"

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  item: {
    type: Object,
    required: true,
  },
  // Field provenance is supplied by the server and rendered in slice 5b.
  derivedFields: {
    type: Object,
    default: () => ({}),
  },
  nkosTypes: {
    type: Object,
    default: () => ({}),
  },
})

const isRegistry = computed(() =>
  props.item.type?.includes("http://www.w3.org/ns/dcat#Catalog"),
)
const isFullRepository = computed(() =>
  props.item.type?.includes("http://bartoc.org/full-repository"),
)

// Check whether a field comes from the main record.
function isFieldInherited(field) {
  return Boolean(field && props.derivedFields?.[field]?.from)
}

// MetadataRow may be nested inside MetadataListRow. Providing this once avoids
// passing the provenance map and legend ID through every metadata component.
provide("field-inheritance", {
  isInherited: isFieldInherited,
  descriptionId: INHERITANCE_LEGEND_ID,
})

// The abstract is introductory text rather than a metadata-table row, so its
// inheritance marker is computed separately.
const definitionInherited = computed(() => isFieldInherited("definition"))

// Show linked editions in chronological order. Undated records come last.
const editionRecords = computed(() => (
  sortEditionRecordsByStartDate(props.item._versionOfBacklink)
))
const hasEditions = computed(() => Boolean(editionRecords.value.length))
const header = inject("header", {})
// Edit access stays pending until login restoration and the update permission
// check have both finished. Only allowed editors may load quality findings.
const editAccess = computed(() => unref(header.editAccess) || "denied")
const userCanEdit = computed(() => editAccess.value === "allowed")
// ItemQuality reports its finding count after its live checks and daily report
// have loaded. A null summary means that this work has not completed yet.
const qualitySummary = ref(null)
const hasQualityFindings = computed(() => (qualitySummary.value?.total || 0) > 0)
// Remember an explicit #quality request independently from access and results,
// so login restoration cannot silently replace the requested URL fragment.
const qualityRequested = ref(false)
// Direct links show a placeholder until access is known.
const qualityTabLoading = computed(() => (
  qualityRequested.value && editAccess.value === "pending"
))
// Normal navigation shows Metadata Quality only when an editor has findings.
// A direct link also keeps it available while access is pending or allowed.
const qualityTabAvailable = computed(() => (
  (userCanEdit.value && hasQualityFindings.value)
  || (qualityRequested.value && editAccess.value !== "denied")
))
// Authorized editors must mount ItemQuality even while its Tab is hidden:
// the emitted summary determines whether the Tab should become visible.
const renderQualityTab = computed(() => userCanEdit.value || qualityTabAvailable.value)
// This list mirrors the order of visible Tab components and maps URL fragments
// to the numeric index required by jskos-vue-tabs.
const tabs = computed(() => isRegistry.value
  ? ["about", "access", "identifiers", "terminologies"]
  : [
    "about",
    "access",
    "identifiers",
    ...(props.item.API?.length ? ["content"] : []),
    ...(hasEditions.value ? ["editions"] : []),
    ...(qualityTabAvailable.value ? ["quality"] : []),
  ])
const registryTerminologyCount = ref(null)
const registryTerminologiesTitle = computed(() =>
  registryTerminologyCount.value === null
    ? "Terminologies"
    : `Terminologies (${registryTerminologyCount.value} in BARTOC)`,
)
const activeTab = ref(0)
const ready = ref(false)

// A pending login never changes #quality. Once access permits the dynamic Tab,
// select it after registration. Only a final denial returns the page to About.
watch(
  [editAccess, qualityRequested],
  async ([access, requested]) => {
    if (access === "denied") {
      qualitySummary.value = null
      if (requested) {
        qualityRequested.value = false
        activeTab.value = 0
        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}${window.location.search}#about`,
        )
      }
    } else if (requested) {
      await nextTick()
      syncTabFromHash()
    }
  },
)

// Version number shown on the page.
const currentVersionNumber = computed(() => versionNumber(props.item))

// Main terminology referenced by this version.
const versionOfReference = computed(() => (
  hasValidVersionOf(props.item) ? props.item.versionOf[0] : null
))

// Whether any field comes from the main record.
const hasInheritedFields = computed(() => (
  Object.keys(props.derivedFields || {}).some(isFieldInherited)
))

// Data used by the concept browser.
const conceptScheme = computed(() => ({
  uri: props.item.uri,
  identifier: props.item.identifier,
  API: props.item.API,
  DISPLAY: props.item.DISPLAY,
  CQLKEY: props.item.CQLKEY,
  notationPattern: props.item.notationPattern,
}))

function syncTabFromHash() {
  const requestedTab = window.location.hash.slice(1)
  // Set this first so #quality is added to tabs before its index is resolved.
  qualityRequested.value = requestedTab === "quality"
  const index = tabs.value.indexOf(requestedTab)
  activeTab.value = index === -1 ? 0 : index
}

function changeTab({ index }) {
  // jskos-vue-tabs emits changes while its Tab children are still registering.
  if (!ready.value) {
    return
  }

  const selectedTab = tabs.value[index]
  // A user-selected Quality tab must also survive a temporary login refresh.
  qualityRequested.value = selectedTab === "quality"
  const hash = `#${selectedTab}`
  if (window.location.hash !== hash) {
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}${hash}`)
  }
}

onMounted(async () => {
  syncTabFromHash()
  window.addEventListener("hashchange", syncTabFromHash)
  // Registration emits change events. Ignore them until the initial URL tab,
  // including the pending Quality placeholder, has mounted.
  await nextTick()
  ready.value = true
})

onBeforeUnmount(() => {
  window.removeEventListener("hashchange", syncTabFromHash)
})
</script>

<style scoped>
.version-inheritance-legend {
  font-weight: normal;
}

.version-inheritance-marker {
  color: var(--cc-color-primary);
}

.terminology-editions {
  padding-inline-start: 0;
  list-style: none;
}

.terminology-editions > li + li {
  margin-block-start: var(--cc-row-gap);
}

.metadata-quality-loading {
  margin: 0;
  color: var(--cc-color-muted);
  font-size: var(--cc-font-size-sm);
}
</style>
