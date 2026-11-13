<template>
  <div class="cc-distributions-editor">
    <div class="cc-distributions-editor__help">
      At which URLs is the terminology being made available (use <a href="#field-api">vocabulary services</a> below for APIs)?
    </div>
    <div
      v-for="(distribution, index) in modelValue"
      :key="index"
      class="cc-distributions-editor__entry">
      <div class="cc-distributions-editor__url-row">
        <label class="cc-distributions-editor__url">
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

      <div class="cc-distributions-editor__type-group">
        <fieldset class="cc-distributions-editor__type">
          <legend class="cc-visually-hidden">
            URL type
          </legend>
          <label
            v-for="type, property in distributionTypes"
            :key="property"
            class="cc-distributions-editor__type-option">
            <input
              class="cc-visually-hidden"
              type="radio"
              :name="`${typeGroupId}-distribution-${index}`"
              :value="property"
              :checked="distributionType(distribution) === property"
              @change="updateDistribution(
                index,
                withType(distribution, property),
              )">
            <span class="cc-distributions-editor__type-label">
              {{ type.label }}
            </span>
          </label>
        </fieldset>
      </div>

      <dl
        v-if="hasVisibleMetadata(distribution)"
        class="cc-distributions-editor__metadata">
        <div
          v-if="isDirectDownload(distribution) && distribution.format"
          class="cc-distributions-editor__metadata-item">
          <dt>Format</dt>
          <dd>{{ distribution.format }}</dd>
        </div>
        <div
          v-if="isDirectDownload(distribution) && distribution.mimetype"
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
        <input
          v-model="newDistribution.url"
          type="url"
          class="cc-form-control"
          aria-label="New distribution URL"
          :aria-invalid="invalidUrl(newDistribution.url)"
          placeholder="https://example.org/vocabulary">
      </label>

      <div class="cc-distributions-editor__type-group">
        <fieldset class="cc-distributions-editor__type">
          <legend class="cc-visually-hidden">
            URL type
          </legend>
          <label
            v-for="type, property in distributionTypes"
            :key="property"
            class="cc-distributions-editor__type-option">
            <input
              v-model="newDistribution.type"
              class="cc-visually-hidden"
              type="radio"
              :name="`${typeGroupId}-new-distribution`"
              :value="property">
            <span class="cc-distributions-editor__type-label">
              {{ type.label }}
            </span>
          </label>
        </fieldset>
        <small class="cc-distributions-editor__type-help">
          {{ distributionTypes[newDistribution.type]?.description }}
        </small>
      </div>

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
import { reactive, useId } from "vue"
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
const typeGroupId = useId()
const distributionTypes = {
  download: { label: "Direct download", description: "Terminology data can directly be downloaded from this URL" },
  accessURL: { label: "Publication URL", description: "Landing page or similar, linking to the actual download" },
}
const newDistribution = reactive({ url: "", type: "accessURL" })

// Prefer the direct download when old data contains both URL properties.
function isDirectDownload(distribution) {
  return distribution.download !== undefined
}

// Map the stored URL property to the selected editor option.
function distributionType(distribution) {
  return isDirectDownload(distribution) ? "download" : "accessURL"
}

// The editor exposes one URL for each complete distribution object.
function distributionUrl(distribution) {
  return distribution.download || distribution.accessURL || ""
}

// Download details are contextual; version and license apply to both types.
function hasVisibleMetadata(distribution) {
  return Boolean(
    (isDirectDownload(distribution)
      && (distribution.format || distribution.mimetype))
    || distribution.version
    || distribution.license?.length,
  )
}

// Store the URL in the property selected by the segmented control.
function withUrl(distribution, url) {
  return withSelectedUrl(distribution, url, distributionType(distribution))
}

// Move the current URL without changing the remaining metadata.
function withType(distribution, type) {
  return withSelectedUrl(
    distribution,
    distributionUrl(distribution),
    type,
  )
}

function withSelectedUrl(distribution, url, type) {
  const updated = { ...distribution }
  delete updated.download
  delete updated.accessURL
  updated[type] = url
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

// New entries use a publication URL unless direct download is selected.
function addDistribution() {
  const url = newDistribution.url.trim()

  if (!url || !isValidUrl(url)) {
    return
  }

  emit("update:modelValue", [
    ...props.modelValue,
    { [newDistribution.type]: url },
  ])
  newDistribution.url = ""
  newDistribution.type = "accessURL"
}

// Allow an empty value and validate entered URLs.
function invalidUrl(value) {
  const url = value?.trim()
  return Boolean(url) && !isValidUrl(url)
}
</script>

<style>
.cc-distributions-editor__help {
  padding-bottom: var(--cc-space-md);
}

.cc-distributions-editor__entry {
  border-bottom: 1px solid #CCC;
  padding-bottom: var(--cc-space-md);
}

.cc-distributions-editor__entry,
.cc-distributions-editor__new {
  display: flex;
  flex-direction: column;
  gap: var(--cc-row-gap);
}

.cc-distributions-editor__entry + .cc-distributions-editor__entry,
.cc-distributions-editor__entry + .cc-distributions-editor__new {
  margin-block-start: var(--cc-space-md);
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

.cc-distributions-editor__type-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--cc-space-xs);
}

.cc-distributions-editor__type {
  display: inline-flex;
  align-self: flex-start;
  min-width: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
  border: var(--cc-border-width) solid var(--cc-border-color-control);
  border-radius: var(--cc-radius-sm);
}

.cc-distributions-editor__type-option {
  margin: 0;
  cursor: pointer;
}

.cc-distributions-editor__type-option + .cc-distributions-editor__type-option {
  border-inline-start: var(--cc-border-width) solid var(--cc-border-color-control);
}

.cc-distributions-editor__type-label {
  display: block;
  padding: var(--cc-space-xs) var(--cc-space-sm);
  color: var(--cc-color-text);
  font-size: var(--cc-font-size-sm);
  font-weight: var(--cc-font-weight-regular);
}

.cc-distributions-editor__type-option input:checked + .cc-distributions-editor__type-label {
  background: var(--cc-color-link);
  color: var(--cc-color-on-primary);
}

.cc-distributions-editor__type-option input:focus-visible + .cc-distributions-editor__type-label {
  box-shadow: inset 0 0 0 var(--cc-border-width-strong) var(--cc-color-primary);
}

.cc-distributions-editor__type-help {
  color: var(--cc-color-muted);
  font-size: var(--cc-font-size-sm);
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
