<template>
  <div class="cc-distributions-editor">
    <div
      v-for="(distribution, index) in modelValue"
      :key="index"
      class="cc-distributions-editor__entry">
      <strong class="cc-distributions-editor__title">
        Distribution {{ index + 1 }}
      </strong>

      <div class="cc-distributions-editor__url-row">
        <label class="cc-distributions-editor__url">
          <span>URL</span>
          <input
            :value="distributionUrl(distribution)"
            type="url"
            class="cc-form-control"
            :aria-label="`Distribution URL ${index + 1}`"
            :aria-invalid="invalidUrl(distributionUrl(distribution))"
            @input="updateDistribution(
              index,
              withUrl(distribution, $event.target.value),
            )">
        </label>

        <button
          type="button"
          class="cc-button cc-button-secondary cc-button-icon"
          :aria-label="`Remove distribution ${index + 1}`"
          @click="removeDistribution(index)">
          &times;
        </button>
      </div>

      <label class="cc-distributions-editor__direct-download">
        <input
          :checked="isDirectDownload(distribution)"
          type="checkbox"
          @change="updateDistribution(
            index,
            withDirectDownload(distribution, $event.target.checked),
          )">
        Direct download
      </label>

      <dl
        v-if="hasMetadata(distribution)"
        class="cc-distributions-editor__metadata">
        <div
          v-if="distribution.format"
          class="cc-distributions-editor__metadata-item">
          <dt>Format</dt>
          <dd>{{ distribution.format }}</dd>
        </div>
        <div
          v-if="distribution.mimetype"
          class="cc-distributions-editor__metadata-item">
          <dt>MIME type</dt>
          <dd>{{ distribution.mimetype }}</dd>
        </div>
        <div
          v-if="distribution.version"
          class="cc-distributions-editor__metadata-item">
          <dt>Version</dt>
          <dd>{{ distribution.version }}</dd>
        </div>
        <div
          v-if="distribution.license?.length"
          class="cc-distributions-editor__metadata-item">
          <dt>License</dt>
          <dd>
            <template
              v-for="(license, licenseIndex) in distribution.license"
              :key="license.uri || licenseIndex">
              <span v-if="licenseIndex">; </span>
              <ItemName :item="license" />
            </template>
          </dd>
        </div>
      </dl>
    </div>

    <div class="cc-distributions-editor__new">
      <strong class="cc-distributions-editor__title">New distribution</strong>

      <label class="cc-distributions-editor__url">
        <span>URL</span>
        <input
          v-model="newDistribution.url"
          type="url"
          class="cc-form-control"
          aria-label="New distribution URL"
          :aria-invalid="invalidUrl(newDistribution.url)"
          placeholder="https://example.org/vocabulary">
      </label>

      <label class="cc-distributions-editor__direct-download">
        <input
          v-model="newDistribution.directDownload"
          type="checkbox">
        Direct download
      </label>

      <button
        type="button"
        class="cc-button cc-button-secondary cc-distributions-editor__add"
        :disabled="!newDistribution.url.trim() || invalidUrl(newDistribution.url)"
        @click="addDistribution">
        add distribution
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue"
import { isValidUrl } from "../utils.js"
import ItemName from "./ItemName.vue"

defineOptions({ name: "DistributionsEditor" })

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(["update:modelValue"])
const newDistribution = reactive({ url: "", directDownload: false })

// Prefer the direct download when old data contains both URL properties.
function isDirectDownload(distribution) {
  return distribution.download !== undefined
}

// The editor exposes one URL for each complete distribution object.
function distributionUrl(distribution) {
  return distribution.download || distribution.accessURL || ""
}

// Do not render empty metadata rows.
function hasMetadata(distribution) {
  return Boolean(
    distribution.format
    || distribution.mimetype
    || distribution.version
    || distribution.license?.length,
  )
}

// Store the URL in the property selected by the checkbox.
function withUrl(distribution, url) {
  return withSelectedUrl(distribution, url, isDirectDownload(distribution))
}

// Move the current URL without changing the remaining metadata.
function withDirectDownload(distribution, directDownload) {
  return withSelectedUrl(
    distribution,
    distributionUrl(distribution),
    directDownload,
  )
}

function withSelectedUrl(distribution, url, directDownload) {
  const updated = { ...distribution }
  delete updated.download
  delete updated.accessURL
  updated[directDownload ? "download" : "accessURL"] = url
  return updated
}

// Replace one distribution without mutating the parent array.
function updateDistribution(index, distribution) {
  const distributions = [...props.modelValue]
  distributions[index] = distribution
  emit("update:modelValue", distributions)
}

// Remove the complete distribution, including its read-only metadata.
function removeDistribution(index) {
  emit(
    "update:modelValue",
    props.modelValue.filter((_, itemIndex) => itemIndex !== index),
  )
}

// New entries use an access URL unless direct download is selected.
function addDistribution() {
  const url = newDistribution.url.trim()

  if (!url || !isValidUrl(url)) {
    return
  }

  const property = newDistribution.directDownload ? "download" : "accessURL"
  emit("update:modelValue", [...props.modelValue, { [property]: url }])
  newDistribution.url = ""
  newDistribution.directDownload = false
}

// Allow an empty value and validate entered URLs.
function invalidUrl(value) {
  const url = value?.trim()
  return Boolean(url) && !isValidUrl(url)
}
</script>

<style scoped>
.cc-distributions-editor__entry,
.cc-distributions-editor__new {
  display: flex;
  flex-direction: column;
  gap: var(--cc-row-gap);
}

.cc-distributions-editor__entry + .cc-distributions-editor__entry,
.cc-distributions-editor__entry + .cc-distributions-editor__new {
  padding-block-start: var(--cc-space-lg);
  margin-block-start: var(--cc-space-sm);
  border-block-start: var(--cc-border-width) solid var(--cc-border-color);
}

.cc-distributions-editor__title {
  font-size: var(--cc-font-size-base);
  font-weight: var(--cc-font-weight-regular);
}

.cc-distributions-editor__url {
  display: flex;
  flex-direction: column;
  gap: var(--cc-space-xs);
  margin: 0;
  color: var(--cc-color-muted);
  font-size: var(--cc-font-size-sm);
}

.cc-distributions-editor__url-row {
  display: flex;
  align-items: flex-end;
  gap: var(--cc-space-sm);
}

.cc-distributions-editor__url-row .cc-distributions-editor__url {
  flex: 1 1 auto;
  min-width: 0;
}

.cc-distributions-editor__url .cc-form-control {
  font-weight: var(--cc-font-weight-light);
}

.cc-distributions-editor__url .cc-form-control[aria-invalid="true"] {
  border-color: var(--cc-color-danger);
}

.cc-distributions-editor__direct-download {
  display: flex;
  align-items: center;
  gap: var(--cc-space-sm);
}

.cc-distributions-editor__metadata {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--cc-space-sm) var(--cc-space-md);
  padding-block-start: var(--cc-space-sm);
  margin: var(--cc-space-xs) 0 0;
}

.cc-distributions-editor__metadata-item {
  min-width: 0;
}

.cc-distributions-editor__metadata dt {
  color: var(--cc-color-muted);
  font-size: var(--cc-font-size-sm);
}

.cc-distributions-editor__metadata dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.cc-distributions-editor__add {
  align-self: flex-start;
}

@media not (min-width: 48rem) {
  .cc-distributions-editor__metadata {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 36rem) {
  .cc-distributions-editor {
    padding-block-start: var(--cc-space-sm);
  }
}
</style>
