<template>
  <table class="cc-table">
    <tbody>
      <MetadataRow
        v-if="item.uri"
        icon="link"
        label="URI">
        <ExternalLink :url="item.uri" />
      </MetadataRow>

      <MetadataListRow
        field="identifier"
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
        field="namespace"
        label="Namespace">
        <ExternalLink :url="item.namespace" />
      </MetadataRow>

      <MetadataRow
        v-if="item.notationPattern"
        field="notationPattern"
        label="Notation pattern">
        {{ item.notationPattern }}
      </MetadataRow>

      <MetadataRow
        v-if="item.uriPattern"
        field="uriPattern"
        label="URI pattern">
        {{ item.uriPattern }}
      </MetadataRow>

      <MetadataListRow
        field="exampleNotations"
        source-field="notationExamples"
        label="Examples"
        :items="item.notationExamples" />
    </tbody>
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
