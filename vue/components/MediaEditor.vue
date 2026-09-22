<template>
  <!-- Edit one thumbnail URL for each supported JSKOS media manifest. -->
  <div class="cc-media-editor">
    <OrderedList
      :model-value="rows"
      @update:model-value="updateRows">
      <template #default="{ item: media, index, update }">
        <input
          :value="mediaThumbnailUrl(media)"
          type="url"
          class="cc-form-control"
          :class="{ 'cc-form-control--invalid': thumbnailInvalid(media) }"
          :aria-invalid="thumbnailInvalid(media)"
          :aria-describedby="thumbnailInvalid(media) ? `media-url-feedback-${index}` : undefined"
          @input="update(withMediaThumbnail(media, $event.target.value))">
        <div
          v-if="thumbnailInvalid(media)"
          :id="`media-url-feedback-${index}`"
          class="cc-form-feedback--invalid">
          Enter a complete URL starting with http:// or https://
        </div>
      </template>
    </OrderedList>
    <button
      type="button"
      class="cc-button cc-button-secondary"
      @click="add">
      add image
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue"
import {
  isValidUrl,
  mediaThumbnailUrl,
  withMediaThumbnail,
} from "../utils.js"
import OrderedList from "./OrderedList.vue"

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(["update:modelValue"])

// Keep local copies so empty rows are not added to the JSKOS record.
const rows = ref(props.modelValue.map(media => withMediaThumbnail(
  media,
  mediaThumbnailUrl(media),
)))

function emitMedia() {
  // Do not send empty rows to the parent.
  emit(
    "update:modelValue",
    rows.value
      .filter(media => mediaThumbnailUrl(media)?.trim())
      .map(media => withMediaThumbnail(media, mediaThumbnailUrl(media))),
  )
}

function add() {
  // Do not update the parent until the user enters a URL.
  rows.value.push(withMediaThumbnail())
}

function updateRows(value) {
  // OrderedList returns a new array after each change.
  rows.value = value
  emitMedia()
}

function thumbnailInvalid(media) {
  const thumbnail = mediaThumbnailUrl(media)
  return Boolean(thumbnail?.trim()) && !isValidUrl(thumbnail)
}
</script>

<style scoped>
.cc-media-editor > .cc-button {
  margin-top: var(--cc-space-xs);
}
</style>
