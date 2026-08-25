<template>
  <table class="cc-table cc-table--compact">
    <thead>
      <tr>
        <th class="endpoint-url-column">
          URL
        </th>
        <th class="endpoint-type-column">
          API type
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(api,i) in endpoints"
        :key="i">
        <td class="endpoint-url-column">
          <input
            v-model="api.url"
            type="text"
            class="cc-form-control"
            :class="{ 'cc-form-control--invalid': endpointInvalid(api) }"
            :aria-invalid="endpointInvalid(api)"
            :aria-describedby="endpointInvalid(api) ? `endpoint-url-feedback-${i}` : undefined">
          <div
            v-if="endpointInvalid(api)"
            :id="`endpoint-url-feedback-${i}`"
            class="cc-form-feedback--invalid">
            Enter a complete URL starting with http:// or https://
          </div>
        </td>
        <td class="endpoint-type-column">
          <item-select
            v-model="api.type"
            :scheme="apiTypesScheme"
            :depth="2"
            :extract-label="jskos.prefLabel" />
        </td>
        <td class="endpoint-actions-column">
          <button
            v-if="endpoints.length > 1"
            type="button"
            class="cc-button cc-button-secondary cc-button-icon button-remove"
            @click="remove(i)">
            &times;
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { ref, watch } from "vue"
import ItemSelect from "./ItemSelect.vue"
import jskos from "jskos-tools"
import { apiTypesScheme, isValidUrl } from "../utils.js"

// Form to select an API endpoint
const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(["update:modelValue"])

// Deep copy of modelValue.
const endpoints = ref(props.modelValue.map(endpoint => ({ ...endpoint })))

watch(
  endpoints,
  (value) => {
    if (!value.find(({ url }) => url.trim() === "")) {
      value.push({ url: "", type: "http://bartoc.org/api-type/webservice" })
    }
    emit("update:modelValue", value)
  },
  { deep: true, immediate: true },
)

function remove(i) {
  endpoints.value.splice(i, 1)
}

function endpointInvalid(endpoint) {
  return Boolean(endpoint.url?.trim()) && !isValidUrl(endpoint.url)
}
</script>

<style scoped>
.endpoint-url-column {
  width: 66.667%;
}

.endpoint-type-column {
  width: 25%;
}

.endpoint-actions-column {
  width: 8.333%;
}
</style>
