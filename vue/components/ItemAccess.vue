<template>
  <table class="cc-table">
    <tbody>
      <MetadataRow
        v-if="item.url"
        :field="isRegistry ? '' : 'url'"
        source-field="url"
        icon="home"
        label="Homepage">
        <ExternalLink :url="item.url" />
      </MetadataRow>

      <MetadataListRow
        :field="isRegistry ? '' : 'additionalLinks'"
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
        v-if="!isRegistry"
        field="issueTracker"
        label="Issue tracker"
        :items="item.issueTracker">
        <template #item="{ item: tracker }">
          <ExternalLink :url="tracker.uri" />
        </template>
      </MetadataListRow>

      <MetadataListRow
        v-if="!isRegistry"
        field="access"
        label="Access"
        :items="item.ACCESS"
        list-style="inline">
        <template #item="{ item: access }">
          <ItemLink :item="access" />
        </template>
      </MetadataListRow>

      <MetadataListRow
        :field="isRegistry ? '' : 'license'"
        label="License"
        :items="item.license"
        :list-style="isRegistry ? 'unstyled' : 'inline'">
        <template #item="{ item: license }">
          <ItemLink
            :item="license"
            :base="isRegistry ? '' : '/vocabularies?license='" />
        </template>
      </MetadataListRow>

      <MetadataListRow
        :field="isRegistry ? '' : 'publisher'"
        label="Publisher"
        :items="item.publisher">
        <template #item="{ item: publisher }">
          <ItemLink
            :item="publisher"
            :base="isRegistry ? '' : '/vocabularies/?field=publisher_en&search='" />
        </template>
      </MetadataListRow>

      <MetadataListRow
        v-if="!isRegistry"
        field="address"
        label="Address"
        :items="address" />

      <MetadataRow
        v-if="!isRegistry && item.CONTACT"
        field="contact"
        label="Contact">
        {{ item.CONTACT }}
      </MetadataRow>

      <MetadataListRow
        v-if="!isRegistry"
        field="formats"
        label="Format"
        :items="item.FORMAT"
        list-style="inline">
        <template #item="{ item: format }">
          <ItemLink :item="format" />
        </template>
      </MetadataListRow>

      <MetadataListRow
        v-if="!isRegistry"
        field="distributions"
        label="Downloads"
        :items="downloadDistributions"
        :preview-limit="5">
        <template #item="{ item: distribution }">
          <span :title="distribution.download">
            <ExternalLink
              :url="distribution.download"
              :label="downloadLabel(distribution)" />
          </span>
        </template>
      </MetadataListRow>

      <MetadataListRow
        v-if="!isRegistry"
        field="distributions"
        label="Publication URLs"
        :items="accessDistributions"
        :preview-limit="5">
        <template #item="{ item: distribution }">
          <ExternalLink :url="distribution.accessURL" />
        </template>
      </MetadataListRow>

      <MetadataListRow
        :field="isRegistry ? '' : 'api'"
        :label="isRegistry ? 'Services (API)' : 'Data sources'"
        :items="item.API">
        <template #item="{ item: endpoint }">
          <ServiceLink
            :scheme="{ uri: item.uri }"
            :endpoint="endpoint" />
        </template>
      </MetadataListRow>

      <MetadataListRow
        v-if="!isRegistry"
        field="listedIn"
        label="Part of"
        :items="item.partOf">
        <template #item="{ item: terminology }">
          <ItemLink :item="terminology" />
        </template>
      </MetadataListRow>
    </tbody>
  </table>
</template>

<script setup>
import { computed } from "vue"
import ExternalLink from "./ExternalLink.vue"
import ItemLink from "./ItemLink.vue"
import MetadataListRow from "./MetadataListRow.vue"
import MetadataRow from "./MetadataRow.vue"
import ServiceLink from "./ServiceLink.vue"
import { downloadLabel } from "../utils/downloadLabel.js"

defineOptions({ name: "ItemAccess" })

const props = defineProps({
  item: { type: Object, required: true },
  isRegistry: { type: Boolean, default: false },
})

const downloadDistributions = computed(() =>
  (props.item.distributions || [])
    .filter(distribution => distribution?.download),
)
const accessDistributions = computed(() =>
  (props.item.distributions || [])
    .filter(distribution => distribution?.accessURL),
)

const address = computed(() => [
  "street",
  "ext",
  "locality",
  "region",
  "code",
  "country",
].map(field => props.item.ADDRESS?.[field]).filter(Boolean))

</script>
