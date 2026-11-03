<template>
  <h1>{{ title }}</h1>
  <LocalizedAbstract :abstract="item.definition" />
  <LocalizedAbstract :abstract="item.scopeNote" />

  <table class="cc-table cc-table--divided">
    <MetadataRow
      icon="link"
      label="URI">
      <ExternalLink :url="item.uri" />
    </MetadataRow>

    <MetadataListRow
      label="Services (API)"
      :items="item.API">
      <template #item="{ item: endpoint }">
        <ServiceLink
          :scheme="item"
          :endpoint="endpoint" />
      </template>
    </MetadataListRow>

    <MetadataRow
      v-if="item.url"
      icon="home"
      label="Homepage">
      <ExternalLink :url="item.url" />
    </MetadataRow>

    <MetadataListRow
      icon="star"
      label="Identifiers"
      :items="item.identifier" />

    <MetadataRow
      v-if="item.startDate"
      icon="calendar"
      label="Created">
      {{ item.startDate }}
    </MetadataRow>

    <MetadataRow
      v-if="item.endDate"
      icon="calendar"
      label="Dissolved">
      {{ item.endDate }}
    </MetadataRow>

    <MetadataListRow
      icon="id"
      label="Languages"
      :items="item.languages" />

    <MetadataListRow
      label="Subject"
      :items="item.subject">
      <template #item="{ item: subject }">
        <ItemLink :item="subject" />
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
      label="License"
      :items="item.license">
      <template #item="{ item: license }">
        <ItemLink :item="license" />
      </template>
    </MetadataListRow>

    <MetadataRow label="Function">
      <a
        v-if="isFullRepository"
        href="/full-repository">
        terminology {{ item.API?.length ? "service" : "repository" }}
      </a>
      <template v-else>
        metadata registry
      </template>
    </MetadataRow>

    <MetadataRow label="Terminologies in BARTOC">
      <RegistryVocabularies :registry-uri="item.uri" />
    </MetadataRow>
  </table>

  <ItemDates :item="item" />
</template>

<script setup>
import { computed } from "vue"
import ExternalLink from "../components/ExternalLink.vue"
import ItemDates from "../components/ItemDates.vue"
import ItemLink from "../components/ItemLink.vue"
import LocalizedAbstract from "../components/LocalizedAbstract.vue"
import MetadataListRow from "../components/MetadataListRow.vue"
import MetadataRow from "../components/MetadataRow.vue"
import RegistryVocabularies from "../components/RegistryVocabularies.vue"
import ServiceLink from "../components/ServiceLink.vue"

defineOptions({ name: "RegistryPage" })

const props = defineProps({
  title: { type: String, required: true },
  item: { type: Object, required: true },
})

const isFullRepository = computed(() =>
  props.item.type?.includes("http://bartoc.org/full-repository"),
)
</script>
