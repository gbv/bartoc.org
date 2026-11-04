<template>
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
  </table>
</template>

<script setup>
import ExternalLink from "./ExternalLink.vue"
import ItemLink from "./ItemLink.vue"
import LocalizedAbstract from "./LocalizedAbstract.vue"
import MetadataListRow from "./MetadataListRow.vue"
import MetadataRow from "./MetadataRow.vue"
import ServiceLink from "./ServiceLink.vue"

defineOptions({ name: "RegistryMetadata" })

defineProps({
  item: { type: Object, required: true },
})
</script>
