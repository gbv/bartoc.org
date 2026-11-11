
<template>
  <div class="cc-distributions-editor">
    <section class="cc-distributions-editor__section cc-distributions-editor__section--downloads">
      <strong>Download URLs</strong>
      <OrderedList
        :model-value="downloadRows"
        :orderable="false"
        @update:model-value="updateRows($event, 'download')">
        <template #default="{ item: row, update }">
          <input
            :value="row.distribution.download"
            type="url"
            class="cc-form-control"
            :class="{
              'cc-form-control--invalid': invalidUrl(row.distribution.download),
            }"
            :aria-label="`Download URL ${row.index + 1}`"
            :aria-invalid="invalidUrl(row.distribution.download)"
            @input="update({
              ...row,
              distribution: {
                ...row.distribution,
                download: $event.target.value,
              },
            })">
        </template>
      </OrderedList>

      <input
        v-model="newUrls.download"
        type="url"
        class="cc-form-control"
        :class="{ 'cc-form-control--invalid': invalidUrl(newUrls.download) }"
        aria-label="New download URL"
        placeholder="https://example.org/vocabulary.ttl">

      <button
        type="button"
        class="cc-button cc-button-secondary"
        :disabled="!newUrls.download.trim() || invalidUrl(newUrls.download)"
        @click="addUrl('download')">
        add download
      </button>
    </section>

    <section class="cc-distributions-editor__section cc-distributions-editor__section--publications">
      <strong>Publication URLs</strong>
      <OrderedList
        :model-value="publicationRows"
        :orderable="false"
        @update:model-value="updateRows($event, 'accessURL')">
        <template #default="{ item: row, update }">
          <input
            :value="row.distribution.accessURL"
            type="url"
            class="cc-form-control"
            :class="{
              'cc-form-control--invalid': invalidUrl(row.distribution.accessURL),
            }"
            :aria-label="`Publication URL ${row.index + 1}`"
            :aria-invalid="invalidUrl(row.distribution.accessURL)"
            @input="update({
              ...row,
              distribution: {
                ...row.distribution,
                accessURL: $event.target.value,
              },
            })">
        </template>
      </OrderedList>

      <input
        v-model="newUrls.accessURL"
        type="url"
        class="cc-form-control"
        :class="{ 'cc-form-control--invalid': invalidUrl(newUrls.accessURL) }"
        aria-label="New publication URL"
        placeholder="https://example.org/vocabulary">

      <button
        type="button"
        class="cc-button cc-button-secondary"
        :disabled="!newUrls.accessURL.trim() || invalidUrl(newUrls.accessURL)"
        @click="addUrl('accessURL')">
        add publication
      </button>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive } from "vue"
import { isValidUrl } from "../utils.js"
import OrderedList from "./OrderedList.vue"

defineOptions({ name: "DistributionsEditor" })

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(["update:modelValue"])
const newUrls = reactive({ download: "", accessURL: "" })

const downloadRows = computed(() => rowsFor("download"))
const publicationRows = computed(() => rowsFor("accessURL"))

// Show rows for one URL field and keep their original indexes.
function rowsFor(property) {
  return props.modelValue.flatMap((distribution, index) =>
    distribution?.[property] ? [{ index, distribution }] : [],
  )
}

// Apply changes to the full distribution list.
function updateRows(rows, property) {
  const updated = new Map(
    rows.map(({ index, distribution }) => [index, distribution]),
  )

  const distributions = props.modelValue.flatMap((distribution, index) => {
    if (!distribution?.[property]) {
      return [distribution]
    }

    const value = updated.get(index)

    if (value?.[property]?.trim()) {
      return [value]
    }

    // Keep the distribution if it still has another URL.
    const remaining = { ...distribution }
    delete remaining[property]
    if (remaining.download || remaining.accessURL) {
      return [remaining]
    }

    return []
  })

  emit("update:modelValue", distributions)
}

// Add a distribution with this URL field.
function addUrl(property) {
  const url = newUrls[property].trim()

  if (!url || !isValidUrl(url)) {
    return
  }

  emit("update:modelValue", [...props.modelValue, { [property]: url }])
  newUrls[property] = ""
}

// Allow an empty value and validate entered URLs.
function invalidUrl(value) {
  const url = value?.trim()
  return Boolean(url) && !isValidUrl(url)
}
</script>

<style scoped>
.cc-distributions-editor__section + .cc-distributions-editor__section {
  margin-block-start: var(--cc-space-md);
}
</style>
