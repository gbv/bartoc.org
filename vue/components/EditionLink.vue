<template>
  <ItemLink :item="displayRecord" />
  <small
    v-if="metadata.length"
    class="edition-metadata">
    {{ ` ${metadata.join(" · ")}` }}
  </small>
</template>

<script setup>
import { computed, toRaw } from "vue"
import { deriveEditionPrefLabel, versionNumber } from "../../src/editions.js"
import ItemLink from "./ItemLink.vue"

const props = defineProps({
  editionRecord: {
    type: Object,
    required: true,
  },
  mainRecord: {
    type: Object,
    required: true,
  },
})

// Build the edition title from the original records.
const editionTitle = computed(() => deriveEditionPrefLabel(
  toRaw(props.editionRecord),
  toRaw(props.mainRecord),
))

// Show the derived title without changing the edition record.
const displayRecord = computed(() => {
  return editionTitle.value.prefLabel
    ? { ...props.editionRecord, prefLabel: editionTitle.value.prefLabel }
    : props.editionRecord
})

// Metadata shown after the edition title.
const metadata = computed(() => {
  const number = versionNumber(props.editionRecord)
  const hasLocalTitle = editionTitle.value.prefLabel && !editionTitle.value.derived
  const id = props.editionRecord.uri?.split("/").pop()

  // Do not repeat a number already included in the derived title.
  return [
    number && hasLocalTitle ? `version ${number}` : "",
    props.editionRecord.startDate ? `since ${props.editionRecord.startDate}` : "",
    props.editionRecord.extent,
    id ? `BARTOC ID ${id}` : "",
  ].filter(Boolean)
})
</script>

<style>
.edition-metadata {
  color: var(--cc-color-muted);
}
</style>
