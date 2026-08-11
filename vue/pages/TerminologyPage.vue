<template>
  <a
    v-if="userCanAdd"
    class="cc-button cc-button-primary float-right"
    :href="`/edit?uri=${encodeURIComponent(item.uri)}`">
    edit
  </a>
  <h1>{{ title }}</h1>

  <Tabs
    v-model="activeTab"
    active-color="var(--cc-color-primary)"
    @change="changeTab">
    <Tab title="About">
      <LocalizedAbstract :abstract="item.definition" />
      <table class="table table-borderless">
        <MetadataListRow
          label="Version of"
          :items="item.versionOf">
          <template #item="{ item: version }">
            <TerminologyVersionLink :item="version" />
          </template>
        </MetadataListRow>

        <MetadataListRow
          label="Titles"
          :items="titles" />

        <MetadataListRow
          label="Abbreviation"
          :items="item.notation" />

        <MetadataListRow
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
          label="Links"
          :items="item.subjectOf">
          <template #item="{ item: link }">
            <ExternalLink
              :url="link.url"
              :label="link.label" />
          </template>
        </MetadataListRow>

        <MetadataListRow
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
          label="Derived Subjects"
          :items="derivedSubjects"
          list-style="inline">
          <template #item="{ item: subject }">
            <ItemLink
              :item="subject"
              base="/vocabularies?subject="
              with-notation />
          </template>
        </MetadataListRow>

        <MetadataListRow
          icon="language"
          label="Languages"
          :items="item.languages"
          list-style="inline" />

        <MetadataRow
          :show="Boolean(item.startDate)"
          icon="calendar"
          label="Created">
          {{ item.startDate }}
        </MetadataRow>

        <MetadataRow
          :show="Boolean(item.endDate)"
          icon="calendar"
          label="Dissolved">
          {{ item.endDate }}
        </MetadataRow>

        <MetadataRow
          :show="Boolean(item.uri)"
          icon="link"
          label="URI">
          <ExternalLink :url="item.uri" />
        </MetadataRow>

        <MetadataRow
          :show="Boolean(item.url)"
          icon="home"
          label="Homepage">
          <ExternalLink :url="item.url" />
        </MetadataRow>

        <MetadataListRow
          label="Versions"
          :items="item._versionOfBacklink">
          <template #item="{ item: version }">
            <TerminologyVersionLink :item="version" />
          </template>
        </MetadataListRow>

        <MetadataListRow
          label="Based on"
          :items="item.basedOn">
          <template #item="{ item: terminology }">
            <ItemLink :item="terminology" />
          </template>
        </MetadataListRow>

        <MetadataListRow
          label="Derived terminologies"
          :items="item._basedOnBacklink">
          <template #item="{ item: terminology }">
            <ItemLink :item="terminology" />
          </template>
        </MetadataListRow>
      </table>
    </Tab>

    <Tab title="Access">
      <table class="table table-borderless">
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
      <table class="table table-borderless">
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

      <template v-if="item.API">
        <hr>
        <ConceptBrowser
          ref="conceptBrowser"
          :scheme="conceptScheme" />
      </template>
    </Tab>

    <Tab title="Identifiers">
      <table class="table table-borderless">
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
  </Tabs>

  <ItemDates :item="item" />
</template>

<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref, unref } from "vue"
import { Tab, Tabs } from "jskos-vue-tabs"
import "jskos-vue-tabs/dist/style.css"
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

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  item: {
    type: Object,
    required: true,
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

const tabs = ["about", "access", "content", "identifiers"]
const activeTab = ref(0)
const conceptBrowser = ref(null)
const ready = ref(false)
const header = inject("header", {})
const userCanAdd = computed(() => unref(header.userCanAdd) || false)

const titles = computed(() => [
  ...Object.values(props.item.prefLabel || {}),
  ...Object.values(props.item.altLabel || {}).flat(),
])
const kosTypeUris = computed(() => (props.item.type || []).slice(1))
const subjects = computed(() => props.item.subject || [])
// Mapped subjects are derived by enrichment; subjects without MAPPING were assigned manually.
const derivedSubjects = computed(() => subjects.value.filter(subject => (
  subject && Object.prototype.hasOwnProperty.call(subject, "MAPPING")
)))
const manualSubjects = computed(() => subjects.value.filter(
  subject => !derivedSubjects.value.includes(subject),
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
  const index = tabs.indexOf(window.location.hash.slice(1))
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

  if (index !== 2) {
    conceptBrowser.value?.selectConcept(null)
  }

  const hash = `#${tabs[index]}`
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
