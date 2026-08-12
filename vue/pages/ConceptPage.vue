<template>
  <h1>{{ title }}</h1>

  <table class="cc-table cc-table--divided">
    <MetadataRow
      v-if="scheme"
      label="Vocabulary">
      <ItemLink
        :item="scheme"
        base="/vocabularies" />
    </MetadataRow>

    <MetadataRow
      :show="Boolean(item.uri)"
      icon="link"
      label="URI">
      <ExternalLink :url="item.uri" />
    </MetadataRow>

    <MetadataListRow
      label="Notation"
      :items="item.notation" />

    <MetadataListRow
      icon="star"
      label="Identifiers"
      :items="item.identifier" />

    <MetadataRow
      :show="Boolean(item.url)"
      icon="home"
      label="Homepage">
      <ExternalLink :url="item.url" />
    </MetadataRow>

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

    <MetadataListRow
      label="Publisher"
      :items="item.publisher">
      <template #item="{ item: publisher }">
        <ItemLink
          :item="publisher"
          base="/publisher" />
      </template>
    </MetadataListRow>

    <MetadataListRow
      label="License"
      :items="item.license">
      <template #item="{ item: license }">
        <ItemLink
          :item="license"
          base="/vocabularies?license=" />
      </template>
    </MetadataListRow>
  </table>

  <a
    v-if="languageSearchUrl"
    :href="languageSearchUrl">
    <i class="fas fa-arrow-right" /> vocabularies in this language
  </a>

  <ItemDates :item="item" />
</template>

<script setup>
import { computed } from "vue"
import ExternalLink from "../components/ExternalLink.vue"
import ItemDates from "../components/ItemDates.vue"
import ItemLink from "../components/ItemLink.vue"
import MetadataListRow from "../components/MetadataListRow.vue"
import MetadataRow from "../components/MetadataRow.vue"

defineOptions({ name: "ConceptPage" })

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  item: {
    type: Object,
    required: true,
  },
})

const scheme = computed(() => props.item.inScheme?.[0] || null)
const languageSearchUrl = computed(() => (
  scheme.value?.uri === "http://bartoc.org/en/node/20287"
  && props.item.notation?.length
    ? `/vocabularies?languages=${props.item.notation.join(",")}`
    : ""
))
</script>
