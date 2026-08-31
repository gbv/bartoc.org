<template>
  <a
    v-if="userCanAdd"
    class="cc-button cc-button-primary page-action"
    :href="`/edit?uri=${encodeURIComponent(item.uri)}`">
    edit
  </a>
  <h1>{{ title }}</h1>
  <p
    v-if="versionMain"
    data-testid="version-context">
    This is a version of <ItemLink :item="versionMain" />.
    <span
      v-if="hasInheritedFields"
      :id="INHERITANCE_LEGEND_ID"
      class="version-inheritance-legend"
      data-testid="version-inheritance-legend">
      Derived values from the main record are marked like this
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
        v-if="tab.title === 'Versions'"
        class="fas fa-code-branch"
        aria-hidden="true" />
      {{ tab.title }}
    </template>
    <Tab title="About">
      <div
        :class="{ 'inherited-field-block': definitionInherited }"
        :aria-describedby="definitionInherited ? INHERITANCE_LEGEND_ID : undefined">
        <i
          v-if="definitionInherited"
          class="fas fa-code-branch inherited-field-marker"
          aria-hidden="true" />
        <div>
          <LocalizedAbstract :abstract="item.definition" />
        </div>
      </div>
      <table class="cc-table">
        <MetadataListRow
          :source-field="['prefLabel', 'altLabel']"
          label="Titles"
          :items="titles" />

        <MetadataListRow
          source-field="notation"
          label="Abbreviation"
          :items="item.notation" />

        <MetadataListRow
          source-field="type"
          label="KOS Type"
          :items="kosTypeUris"
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
          source-field="startDate"
          :show="Boolean(item.startDate)"
          icon="calendar"
          label="Created">
          {{ item.startDate }}
        </MetadataRow>

        <MetadataRow
          source-field="endDate"
          :show="Boolean(item.endDate)"
          icon="calendar"
          label="Dissolved">
          {{ item.endDate }}
        </MetadataRow>

        <MetadataRow
          source-field="uri"
          :show="Boolean(item.uri)"
          icon="link"
          label="URI">
          <ExternalLink :url="item.uri" />
        </MetadataRow>

        <MetadataRow
          source-field="url"
          :show="Boolean(item.url)"
          icon="home"
          label="Homepage">
          <ExternalLink :url="item.url" />
        </MetadataRow>

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
          label="Format"
          :items="item.FORMAT"
          list-style="inline">
          <template #item="{ item: format }">
            <ItemLink :item="formats[format.uri] || format" />
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
          :show="Boolean(item.CONTACT)"
          label="Contact">
          {{ item.CONTACT }}
        </MetadataRow>

        <MetadataListRow
          label="Part of"
          :items="item.partOf">
          <template #item="{ item: terminology }">
            <ItemLink :item="terminology" />
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
      </table>
    </Tab>

    <Tab title="Content">
      <table class="cc-table">
        <MetadataRow
          :show="Boolean(item.extent)"
          label="Size">
          {{ item.extent }}
        </MetadataRow>

        <MetadataListRow
          label="Languages"
          :items="item.languages"
          list-style="inline" />
      </table>

      <!-- Avoid initializing the browser on inactive tabs or without an API. -->
      <template v-if="activeTabName === 'content' && item.API?.length">
        <hr>
        <ConceptBrowser
          ref="conceptBrowser"
          :scheme="conceptScheme" />
      </template>
    </Tab>

    <Tab title="Identifiers">
      <table class="cc-table">
        <MetadataRow
          :show="Boolean(item.uri)"
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
          :show="Boolean(item.namespace)"
          label="Namespace">
          <ExternalLink :url="item.namespace" />
        </MetadataRow>

        <MetadataRow
          :show="Boolean(item.notationPattern)"
          label="Notation pattern">
          {{ item.notationPattern }}
        </MetadataRow>

        <MetadataRow
          :show="Boolean(item.uriPattern)"
          label="URI pattern">
          {{ item.uriPattern }}
        </MetadataRow>

        <MetadataListRow
          label="Examples"
          :items="item.notationExamples" />

        <MetadataRow
          :show="Boolean(item.MARCSPEC)"
          label="MARCspec">
          {{ item.MARCSPEC }}
        </MetadataRow>

        <MetadataRow
          :show="Boolean(item.PICAPATH)"
          label="PICA path">
          {{ item.PICAPATH }}
        </MetadataRow>

        <MetadataRow
          :show="Boolean(item.CQLKEY)"
          label="CQL key">
          {{ item.CQLKEY }}
        </MetadataRow>
      </table>
    </Tab>

    <Tab
      v-if="hasVersions"
      title="Versions">
      <ul class="terminology-versions">
        <li
          v-for="version in item._versionOfBacklink"
          :key="version.uri">
          <TerminologyVersionLink :item="version" />
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
import { hasValidVersionOf } from "../../src/versioning.js"
import ConceptBrowser from "../components/ConceptBrowser.vue"
import ExternalLink from "../components/ExternalLink.vue"
import ItemDates from "../components/ItemDates.vue"
import ItemLink from "../components/ItemLink.vue"
import LocalizedAbstract from "../components/LocalizedAbstract.vue"
import MetadataListRow from "../components/MetadataListRow.vue"
import MetadataRow from "../components/MetadataRow.vue"
import ServiceLink from "../components/ServiceLink.vue"
import TerminologyVersionLink from "../components/TerminologyVersionLink.vue"

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

const hasVersions = computed(() => Boolean(props.item._versionOfBacklink?.length))
const tabs = computed(() => [
  "about",
  "access",
  "content",
  "identifiers",
  ...(hasVersions.value ? ["versions"] : []),
])
const activeTab = ref(0)
const activeTabName = computed(() => tabs.value[activeTab.value])
const conceptBrowser = ref(null)
const ready = ref(false)
const header = inject("header", {})
const userCanAdd = computed(() => unref(header.userCanAdd) || false)

const titles = computed(() => [
  ...Object.values(props.item.prefLabel || {}),
  ...Object.values(props.item.altLabel || {}).flat(),
])
const versionMain = computed(() => (
  hasValidVersionOf(props.item) ? props.item.versionOf[0] : null
))
const hasInheritedFields = computed(() => (
  Object.keys(props.derivedFields || {}).some(isFieldInherited)
))

const kosTypeUris = computed(() => (props.item.type || []).slice(1))
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
.inherited-field-block {
  display: flex;
  gap: 0.5em;
  align-items: flex-start;
  padding-inline: var(--cc-row-padding-x);
}

.inherited-field-block :deep(p:last-child) {
  margin-bottom: 0;
}

.version-inheritance-legend {
  font-weight: normal;
}

.version-inheritance-marker,
.inherited-field-marker {
  color: var(--cc-color-primary);
}

.terminology-versions {
  padding-inline-start: 0;
  list-style: none;
}

.terminology-versions > li + li {
  margin-block-start: var(--cc-row-gap);
}
</style>
