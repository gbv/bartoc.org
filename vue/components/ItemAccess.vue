<template>
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
        <ItemLink
          :item="publisher"
          base="/vocabularies/?field=publisher_en&search=" />
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
      label="Data sources"
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
</template>

<script setup>
import { computed } from "vue"
import ExternalLink from "./ExternalLink.vue"
import ItemLink from "./ItemLink.vue"
import MetadataListRow from "./MetadataListRow.vue"
import MetadataRow from "./MetadataRow.vue"
import ServiceLink from "./ServiceLink.vue"

defineOptions({ name: "ItemAccess" })

const props = defineProps({
  item: { type: Object, required: true },
  accessTypes: { type: Object, default: () => ({}) },
  formats: { type: Object, default: () => ({}) },
})

const address = computed(() => [
  "street",
  "ext",
  "locality",
  "region",
  "code",
  "country",
].map(field => props.item.ADDRESS?.[field]).filter(Boolean))
</script>
