<template>
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
</template>

<script setup>
import ExternalLink from "./ExternalLink.vue"
import MetadataListRow from "./MetadataListRow.vue"
import MetadataRow from "./MetadataRow.vue"

defineOptions({ name: "ItemIdentifiers" })

defineProps({
  item: { type: Object, required: true },
})

function isWebUrl(value) {
  return /^https?:\/\//.test(value)
}
</script>
