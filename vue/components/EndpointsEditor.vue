<template>
  <table class="cc-table cc-table--compact">
    <thead>
      <tr class="d-flex">
        <th class="col-8">
          URL
        </th>
        <th class="col-3">
          API type
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(api,i) in endpoints"
        :key="i"
        class="d-flex">
        <td class="col-8">
          <input
            v-model="api.url"
            type="text"
            class="form-control">
        </td><td class="col-3">
          <item-select
            v-model="api.type"
            :scheme="apiTypesScheme"
            :depth="2"
            :extract-label="jskos.prefLabel" />
        </td><td class="col-1">
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
import { apiTypesScheme } from "../utils.js"

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
</script>
