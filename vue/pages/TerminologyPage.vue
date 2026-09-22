<template>
  <a
    v-if="userCanAdd"
    class="cc-button cc-button-primary page-action"
    :href="`/edit?uri=${encodeURIComponent(item.uri)}`">
    edit
  </a>
  <h1>{{ title }}</h1>
  <p
    v-if="versionOfReference"
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
      <div
        class="abstract-block"
        :class="{ 'inherited-field-block': definitionInherited }"
        :aria-describedby="definitionInherited ? INHERITANCE_LEGEND_ID : undefined">
        <i
          v-if="definitionInherited"
          class="fas fa-code-branch inherited-field-marker"
          aria-hidden="true" />
        <div class="cc-abstract-content">
          <div
            v-if="mediaThumbnails.length"
            class="cc-terminology-media">
            <img
              v-for="(thumbnail, index) in mediaThumbnails"
              :key="`${thumbnail}-${index}`"
              :src="thumbnail"
              alt=""
              class="cc-terminology-media-image"
              loading="lazy"
              decoding="async"
              referrerpolicy="no-referrer">
          </div>
          <LocalizedAbstract :abstract="item.definition" />
        </div>
      </div>
      <table class="cc-table">
        <MetadataListRow
          :source-field="['prefLabel', 'altLabel']"
          label="Titles"
          :items="titles" />

        <MetadataRow
          v-if="currentVersionNumber"
          source-field="version"
          label="Version">
          {{ currentVersionNumber }}
        </MetadataRow>

        <MetadataListRow
          source-field="notation"
          label="Abbreviation"
          :items="item.notation" />

        <MetadataListRow
          source-field="type"
          label="KOS Type"
          :items="displayedKosTypeUris"
          list-style="inline">
          <template #item="{ item: uri }">
            <ItemLink
              :item="nkosTypes[uri] || { uri }"
              base="/vocabularies?type=" />
          </template>
        </MetadataListRow>

        <MetadataListRow
          source-field="subjectOf"
          label="Links"
          :items="item.subjectOf">
          <template #item="{ item: link }">
            <ExternalLink
              :url="link.url"
              :label="link.label" />
          </template>
        </MetadataListRow>

        <MetadataListRow
          source-field="subject"
          label="Subject"
          :items="manualSubjects"
          list-style="inline">
          <template #item="{ item: subject }">
            <ItemLink
              :item="subject"
              base="/vocabularies?subject="
              with-notation />
          </template>
        </MetadataListRow>

        <MetadataListRow
          source-field="subject"
          label="Mapped Subjects"
          :items="mappedSubjects"
          list-style="inline">
          <template #item="{ item: subject }">
            <ItemLink
              :item="subject"
              base="/vocabularies?subject="
              with-notation />
          </template>
        </MetadataListRow>

        <MetadataListRow
          source-field="languages"
          icon="language"
          label="Languages"
          :items="item.languages"
          list-style="inline" />

        <MetadataRow
          v-if="item.extent"
          label="Size">
          {{ item.extent }}
        </MetadataRow>

        <MetadataRow
          v-if="item.startDate || item.endDate"
          source-field="[startDate, endDate]"
          icon="calendar"
          label="Existence">
          {{ item.startDate }}–{{ item.endDate }}
        </MetadataRow>

        <MetadataRow
          v-if="item.uri"
          source-field="uri"
          icon="link"
          label="URI">
          <ExternalLink :url="item.uri" />
        </MetadataRow>

        <MetadataListRow
          label="Wikipedia"
          :items="wikipediaLinks"
          list-style="inline"
          :preview-limit="10">
          <template #item="{ item: wikipediaPage }">
            <ExternalLink
              :url="wikipediaPage.url"
              :label="wikipediaPage.languageName" />
          </template>
        </MetadataListRow>

        <MetadataListRow
          source-field="basedOn"
          label="Based on"
          :items="item.basedOn">
          <template #item="{ item: terminology }">
            <ItemLink :item="terminology" />
          </template>
        </MetadataListRow>

        <MetadataListRow
          source-field="_basedOnBacklink"
          label="Derived terminologies"
          :items="item._basedOnBacklink">
          <template #item="{ item: terminology }">
            <ItemLink :item="terminology" />
          </template>
        </MetadataListRow>
      </table>
    </Tab>

    <Tab title="Access">
      <table class="cc-table">
        <MetadataRow
          v-if="item.url"
          source-field="url"
          icon="home"
          label="Homepage">
          <ExternalLink :url="item.url" />
        </MetadataRow>

        <MetadataListRow
          label="Issue tracker"
          :items="item.issueTracker">
          <template #item="{ item: tracker }">
            <ExternalLink :url="tracker.uri" />
          </template>
        </MetadataListRow>

        <MetadataListRow
          label="Access"
          :items="item.ACCESS"
          list-style="inline">
          <template #item="{ item: access }">
            <ItemLink :item="accessTypes[access.uri] || access" />
          </template>
        </MetadataListRow>

        <MetadataListRow
          label="License"
          :items="item.license"
          list-style="inline">
          <template #item="{ item: license }">
            <ItemLink
              :item="license"
              base="/vocabularies?license=" />
          </template>
        </MetadataListRow>

        <MetadataListRow
          label="Publisher"
          :items="item.publisher">
          <template #item="{ item: publisher }">
            <ItemLink :item="publisher" />
          </template>
        </MetadataListRow>

        <MetadataListRow
          label="Address"
          :items="address" />

        <MetadataRow
          v-if="item.CONTACT"
          label="Contact">
          {{ item.CONTACT }}
        </MetadataRow>

        <MetadataListRow
          label="Format"
          :items="item.FORMAT"
          list-style="inline">
          <template #item="{ item: format }">
            <ItemLink :item="formats[format.uri] || format" />
          </template>
        </MetadataListRow>

        <MetadataListRow
          label="Services (API)"
          :items="item.API">
          <template #item="{ item: endpoint }">
            <ServiceLink
              :scheme="{ uri: item.uri }"
              :endpoint="endpoint" />
          </template>
        </MetadataListRow>

        <MetadataListRow
          label="Part of"
          :items="item.partOf">
          <template #item="{ item: terminology }">
            <ItemLink :item="terminology" />
          </template>
        </MetadataListRow>
      </table>
    </Tab>

    <Tab title="Identifiers">
      <table class="cc-table">
        <MetadataRow
          v-if="item.uri"
          icon="link"
          label="URI">
          <ExternalLink :url="item.uri" />
        </MetadataRow>

        <MetadataListRow
          label="Identifiers"
          :items="item.identifier">
          <template #item="{ item: identifier }">
            <ExternalLink
              v-if="isWebUrl(identifier)"
              :url="identifier" />
            <template v-else>
              {{ identifier }}
            </template>
          </template>
        </MetadataListRow>

        <MetadataRow
          v-if="item.namespace"
          label="Namespace">
          <ExternalLink :url="item.namespace" />
        </MetadataRow>

        <MetadataRow
          v-if="item.notationPattern"
          label="Notation pattern">
          {{ item.notationPattern }}
        </MetadataRow>

        <MetadataRow
          v-if="item.uriPattern"
          label="URI pattern">
          {{ item.uriPattern }}
        </MetadataRow>

        <MetadataListRow
          source-field="notationExamples"
          label="Examples"
          :items="item.notationExamples" />
      </table>
    </Tab>

    <Tab
      v-if="item.API?.length"
      title="Content">
      <ConceptBrowser
        ref="conceptBrowser"
        :scheme="conceptScheme" />
    </Tab>

    <Tab
      v-if="hasEditions"
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
  </Tabs>
  <ItemDates :item="item" />
</template>

<script setup>
import { computed, inject, onBeforeUnmount, onMounted, provide, ref, unref } from "vue"
import { Tab, Tabs } from "jskos-vue-tabs"
import "jskos-vue-tabs/dist/style.css"
import {
  hasValidVersionOf,
  kosTypeUris,
  sortEditionRecordsByStartDate,
  versionNumber,
} from "../../src/editions.js"
import ConceptBrowser from "../components/ConceptBrowser.vue"
import ExternalLink from "../components/ExternalLink.vue"
import ItemDates from "../components/ItemDates.vue"
import ItemLink from "../components/ItemLink.vue"
import LocalizedAbstract from "../components/LocalizedAbstract.vue"
import MetadataListRow from "../components/MetadataListRow.vue"
import MetadataRow from "../components/MetadataRow.vue"
import ServiceLink from "../components/ServiceLink.vue"
import EditionLink from "../components/EditionLink.vue"
import { mediaThumbnailUrl } from "../utils.js"
import { loadWikipediaLinks } from "../utils/wikipedia.js"

defineOptions({ name: "TerminologyPage" })

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
  accessTypes: {
    type: Object,
    default: () => ({}),
  },
  formats: {
    type: Object,
    default: () => ({}),
  },
})

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

// Only render the thumbnail subset supported by the BARTOC editor.
const mediaThumbnails = computed(() => (
  (props.item.media || [])
    .map(mediaThumbnailUrl)
    .filter(thumbnail => typeof thumbnail === "string" && isWebUrl(thumbnail))
))

// Show linked editions in chronological order. Undated records come last.
const editionRecords = computed(() => (
  sortEditionRecordsByStartDate(props.item._versionOfBacklink)
))
const hasEditions = computed(() => Boolean(editionRecords.value.length))
const tabs = computed(() => [
  "about",
  "access",
  "identifiers",
  ...(props.item.API?.length ? ["content"] : []),
  ...(hasEditions.value ? ["editions"] : []),
])
const activeTab = ref(0)
const conceptBrowser = ref(null)
const ready = ref(false)
const wikipediaLinks = ref([])
const header = inject("header", {})
const userCanAdd = computed(() => unref(header.userCanAdd) || false)

const titles = computed(() => [
  ...Object.values(props.item.prefLabel || {}),
  ...Object.values(props.item.altLabel || {}).flat(),
])
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

const displayedKosTypeUris = computed(() => kosTypeUris(props.item))
const subjects = computed(() => props.item.subject || [])
// Mapped subjects carry enrichment provenance in MAPPING. Other subjects were
// assigned manually.
const mappedSubjects = computed(() => subjects.value.filter(subject => (
  subject && Object.prototype.hasOwnProperty.call(subject, "MAPPING")
)))
const manualSubjects = computed(() => subjects.value.filter(
  subject => !mappedSubjects.value.includes(subject),
))
const address = computed(() => [
  "street",
  "ext",
  "locality",
  "region",
  "code",
  "country",
].map(field => props.item.ADDRESS?.[field]).filter(Boolean))

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

  if (tabs.value[index] !== "content") {
    conceptBrowser.value?.selectConcept(null)
  }

  const hash = `#${tabs.value[index]}`
  if (window.location.hash !== hash) {
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}${hash}`)
  }
}

function isWebUrl(value) {
  return /^https?:\/\//.test(value)
}

onMounted(async () => {
  syncTabFromHash()
  ready.value = true
  window.addEventListener("hashchange", syncTabFromHash)
  wikipediaLinks.value = await loadWikipediaLinks(props.item.identifier)
})

onBeforeUnmount(() => {
  window.removeEventListener("hashchange", syncTabFromHash)
})
</script>

<style scoped>
.abstract-block {
  padding-inline: var(--cc-row-padding-x);
}

.abstract-block :deep(p:last-child) {
  margin-bottom: var(--cc-space-md);
}

.cc-abstract-content {
  display: flow-root;
  flex: 1;
  min-width: 0;
}

.cc-terminology-media {
  float: right;
  display: flex;
  width: min(12rem, 35%);
  margin: 0 0 var(--cc-space-md) var(--cc-space-md);
  gap: var(--cc-space-sm);
  flex-direction: column;
}

.cc-terminology-media-image {
  display: block;
  width: 100%;
  max-height: 8rem;
  object-fit: contain;
}

.inherited-field-block {
  display: flex;
  gap: 0.5em;
  align-items: flex-start;
}

.version-inheritance-legend {
  font-weight: normal;
}

.version-inheritance-marker,
.inherited-field-marker {
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
