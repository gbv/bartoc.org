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
      v-if="!isRegistry && qualityAccessGranted"
      title="Metadata Quality"
      :hidden="!hasQualityFindings">
      <ItemQuality
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
import { computed, inject, onBeforeUnmount, onMounted, provide, ref, unref, watch } from "vue"
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
const userCanEdit = computed(() => unref(header.userCanEdit) || false)
const editReady = computed(() => unref(header.editReady) ?? true)
const qualitySummary = ref(null)
const hasQualityFindings = computed(() => (qualitySummary.value?.total || 0) > 0)
const qualityAccessGranted = ref(false)
const showQualityTab = computed(() => qualityAccessGranted.value && hasQualityFindings.value)
const tabs = computed(() => isRegistry.value
  ? ["about", "access", "identifiers", "terminologies"]
  : [
    "about",
    "access",
    "identifiers",
    ...(props.item.API?.length ? ["content"] : []),
    ...(hasEditions.value ? ["editions"] : []),
    ...(showQualityTab.value ? ["quality"] : []),
  ])
const registryTerminologyCount = ref(null)
const registryTerminologiesTitle = computed(() =>
  registryTerminologyCount.value === null
    ? "Terminologies"
    : `Terminologies (${registryTerminologyCount.value} in BARTOC)`,
)
const activeTab = ref(0)
const ready = ref(false)

// Keep the last completed permission while the account is being refreshed.
// This prevents the Quality tab from disappearing and changing the active tab.
watch([userCanEdit, editReady], ([allowed, checked]) => {
  if (!checked) {
    return
  }

  qualityAccessGranted.value = allowed

  // Remove findings when the completed check denies access, so they cannot
  // briefly reappear if authorization is checked again later.
  if (!allowed) {
    qualitySummary.value = null
  }
}, { immediate: true })

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

function tabIndexFromHash() {
  const index = tabs.value.indexOf(window.location.hash.slice(1))
  return index === -1 ? 0 : index
}

function syncTabFromHash() {
  activeTab.value = tabIndexFromHash()
}

function changeTab({ index }) {
  // jskos-vue-tabs emits changes while its Tab children are still registering.
  if (!ready.value) {
    return
  }

  const hash = `#${tabs.value[index]}`
  if (window.location.hash !== hash) {
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}${hash}`)
  }
}

onMounted(() => {
  syncTabFromHash()
  ready.value = true
  window.addEventListener("hashchange", syncTabFromHash)
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
</style>
