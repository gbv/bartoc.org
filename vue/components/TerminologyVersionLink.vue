<template>
  <ItemLink :item="displayRecord" />
  <small
    v-if="versionMetadataParts.length"
    class="terminology-version-details">
    {{ ` ${versionMetadataParts.join(" · ")}` }}
  </small>
</template>

<script setup>
import { computed, toRaw } from "vue"
import { deriveVersionPrefLabel, versionNumber } from "../../src/versioning.js"
import ItemLink from "./ItemLink.vue"

defineOptions({ name: "TerminologyVersionLink" })

const props = defineProps({
  versionRecord: {
    type: Object,
    required: true,
  },
  mainRecord: {
    type: Object,
    required: true,
  },
})

// Build the version title from the original records.
const versionTitle = computed(() => deriveVersionPrefLabel(
  toRaw(props.versionRecord),
  toRaw(props.mainRecord),
))

// Show the derived title without changing the version record.
const displayRecord = computed(() => {
  return versionTitle.value.prefLabel
    ? { ...props.versionRecord, prefLabel: versionTitle.value.prefLabel }
    : props.versionRecord
})

// Metadata shown after the version title.
const versionMetadataParts = computed(() => {
  const number = versionNumber(props.versionRecord)
  const hasLocalTitle = versionTitle.value.prefLabel && !versionTitle.value.derived
  const id = props.versionRecord.uri?.split("/").pop()

  // Do not repeat a number already included in the derived title.
  return [
    number && hasLocalTitle ? `version ${number}` : "",
    props.versionRecord.startDate ? `since ${props.versionRecord.startDate}` : "",
    props.versionRecord.extent,
    id ? `BARTOC ID ${id}` : "",
  ].filter(Boolean)
})
</script>

<style scoped>
.terminology-version-details {
  color: var(--cc-color-muted);
}
</style>
