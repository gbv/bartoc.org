<template>
  <table class="cc-table cc-table--compact">
    <tbody>
      <tr>
        <td>
          <input
            v-model.trim="name"
            type="text"
            class="cc-form-control">
        </td>
        <td>Name</td>
      </tr>
      <tr>
        <td>
          <input
            v-model.trim="uri"
            type="text"
            class="cc-form-control"
            :class="{ 'is-invalid': uriInvalid }">
          <div
            v-if="uriInvalid"
            class="invalid-feedback d-block">
            Please enter a valid HTTP(S) URI
          </div>
        </td>
        <td>URI</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { isValidUrl } from "../utils.js"
import { computed, ref, watch } from "vue"

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})
const publisher = firstPublisher(props.modelValue)
const emit = defineEmits(["update:modelValue"])
const name = ref((publisher.prefLabel || {}).en || "")
const uri = ref(publisher.uri || "")

const uriInvalid = computed(() => {
  return (uri.value || name.value) && !isValidUrl(uri.value)
})

watch(
  () => props.modelValue,
  (value) => {
    const publisher = firstPublisher(value)
    const nextName = (publisher.prefLabel || {}).en || ""
    const nextUri = publisher.uri || ""

    if (nextName !== name.value) {
      name.value = nextName
    }
    if (nextUri !== uri.value) {
      uri.value = nextUri
    }
  },
  { deep: true },
)

watch([name, uri], () => {
  emitValue()
})

function firstPublisher(modelValue) {
  return (modelValue || [])[0] || {}
}

function emitValue() {
  const nextName = name.value.trim()
  const nextUri = uri.value.trim()
  if (!nextName && !nextUri) {
    emit("update:modelValue", [])
    return
  }

  const publisher = {}

  if (nextName) {
    publisher.prefLabel = { en: nextName }
  }
  if (nextUri) {
    publisher.uri = nextUri
  }
  emit("update:modelValue", [publisher])
}
</script>

<style scoped>
.cc-form-control.is-invalid {
  border-color: var(--cc-color-danger);
}

.cc-form-control.is-invalid:focus {
  box-shadow: 0 0 0 0.2rem color-mix(in srgb, var(--cc-color-danger) 25%, transparent);
}
</style>
