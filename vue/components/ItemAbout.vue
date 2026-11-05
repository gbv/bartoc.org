<template>
  <div
    class="abstract-block"
    :class="{ 'inherited-field-block': definitionInherited }"
    :aria-describedby="definitionInherited ? inheritanceLegendId : undefined">
    <i
      v-if="definitionInherited"
      class="fas fa-code-branch inherited-field-marker"
      aria-hidden="true" />
    <div class="cc-abstract-content">
      <div
        v-if="!isRegistry && mediaThumbnails.length"
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
      <LocalizedAbstract
        v-if="isRegistry"
        :abstract="item.scopeNote" />
    </div>
  </div>
  <table class="cc-table">
    <MetadataListRow
      v-if="!isRegistry"
      :source-field="['prefLabel', 'altLabel']"
      label="Titles"
      :items="titles" />

    <MetadataRow
      v-if="!isRegistry && currentVersionNumber"
      source-field="version"
      label="Version">
      {{ currentVersionNumber }}
    </MetadataRow>

    <MetadataListRow
      v-if="!isRegistry"
      source-field="notation"
      label="Abbreviation"
      :items="item.notation" />

    <MetadataListRow
      v-if="!isRegistry"
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
      v-if="!isRegistry"
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
      :items="isRegistry ? item.subject : manualSubjects"
      :list-style="isRegistry ? 'unstyled' : 'inline'">
      <template #item="{ item: subject }">
        <ItemLink
          :item="subject"
          :base="isRegistry ? '' : '/vocabularies?subject='"
          :with-notation="!isRegistry" />
      </template>
    </MetadataListRow>

    <MetadataListRow
      v-if="!isRegistry"
      source-field="subject"
      label="Mapped Subjects"
      :items="mappedSubjects"
      list-style="inline">
      <template #item="{ item: subject }">
        <ItemLink
          :item="subject"
          :base="isRegistry ? '' : '/vocabularies?subject='"
          with-notation />
      </template>
    </MetadataListRow>

    <MetadataListRow
      source-field="languages"
      :icon="isRegistry ? 'id' : 'language'"
      label="Languages"
      :items="displayedLanguages"
      :list-style="isRegistry ? 'unstyled' : 'inline'">
      <template #item="{ item: language }">
        <a
          v-if="!isRegistry"
          :href="`/vocabularies/?filter=language:${language.code}`">
          {{ language.label }}
        </a>
        <template v-else>
          {{ language.code }}
        </template>
      </template>
    </MetadataListRow>

    <MetadataRow
      v-if="!isRegistry && item.extent"
      label="Size">
      {{ item.extent }}
    </MetadataRow>

    <MetadataRow
      v-if="isRegistry && item.startDate"
      icon="calendar"
      label="Created">
      {{ item.startDate }}
    </MetadataRow>

    <MetadataRow
      v-if="isRegistry && item.endDate"
      icon="calendar"
      label="Dissolved">
      {{ item.endDate }}
    </MetadataRow>

    <MetadataRow
      v-if="!isRegistry && (item.startDate || item.endDate)"
      source-field="[startDate, endDate]"
      icon="calendar"
      label="Existence">
      {{ item.startDate }}–{{ item.endDate }}
    </MetadataRow>

    <MetadataListRow
      v-if="!isRegistry"
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
      v-if="!isRegistry"
      source-field="basedOn"
      label="Based on"
      :items="item.basedOn">
      <template #item="{ item: terminology }">
        <ItemLink :item="terminology" />
      </template>
    </MetadataListRow>

    <MetadataListRow
      v-if="!isRegistry"
      source-field="_basedOnBacklink"
      label="Derived terminologies"
      :items="item._basedOnBacklink">
      <template #item="{ item: terminology }">
        <ItemLink :item="terminology" />
      </template>
    </MetadataListRow>

    <MetadataListRow
      v-if="!isRegistry"
      source-field="replacedBy"
      label="Replaced by"
      :items="item.replacedBy">
      <template #item="{ item: terminology }">
        <ItemLink :item="terminology" />
      </template>
    </MetadataListRow>

    <MetadataListRow
      v-if="!isRegistry"
      source-field="_replacedByBacklink"
      label="Successor of"
      :items="item._replacedByBacklink">
      <template #item="{ item: terminology }">
        <ItemLink :item="terminology" />
      </template>
    </MetadataListRow>
  </table>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"
import { kosTypeUris } from "../../src/terminology.js"
import ExternalLink from "./ExternalLink.vue"
import ItemLink from "./ItemLink.vue"
import LocalizedAbstract from "./LocalizedAbstract.vue"
import MetadataListRow from "./MetadataListRow.vue"
import MetadataRow from "./MetadataRow.vue"
import { mediaThumbnailUrl } from "../utils.js"
import { loadLanguageNames } from "../utils/languages.js"
import { loadWikipediaLinks } from "../utils/wikipedia.js"

defineOptions({ name: "ItemAbout" })

const props = defineProps({
  item: { type: Object, required: true },
  isRegistry: { type: Boolean, default: false },
  nkosTypes: { type: Object, default: () => ({}) },
  currentVersionNumber: { type: [String, Number], default: null },
  definitionInherited: { type: Boolean, default: false },
  inheritanceLegendId: { type: String, required: true },
})

const mediaThumbnails = computed(() => (
  (props.item.media || [])
    .map(mediaThumbnailUrl)
    .filter(thumbnail => typeof thumbnail === "string" && isWebUrl(thumbnail))
))
const titles = computed(() => [
  ...Object.values(props.item.prefLabel || {}),
  ...Object.values(props.item.altLabel || {}).flat(),
])
const displayedKosTypeUris = computed(() => kosTypeUris(props.item))
const subjects = computed(() => props.item.subject || [])
// Mapped subjects carry enrichment provenance in MAPPING.
const mappedSubjects = computed(() => subjects.value.filter(subject => (
  subject && Object.prototype.hasOwnProperty.call(subject, "MAPPING")
)))
const manualSubjects = computed(() => subjects.value.filter(
  subject => !mappedSubjects.value.includes(subject),
))
const displayedLanguages = ref((props.item.languages || []).map(code => ({
  code,
  label: code,
})))
const wikipediaLinks = ref([])

function isWebUrl(value) {
  return /^https?:\/\//.test(value)
}

onMounted(async () => {
  if (props.isRegistry) {
    return
  }

  const languageCodes = props.item.languages || []
  const languageNames = await loadLanguageNames(languageCodes)
  displayedLanguages.value = languageCodes.map(code => ({
    code,
    label: languageNames[code] || code,
  }))
  wikipediaLinks.value = await loadWikipediaLinks(props.item.identifier)
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

.inherited-field-marker {
  color: var(--cc-color-primary);
}
</style>
