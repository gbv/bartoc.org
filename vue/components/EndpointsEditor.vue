<template>
  <table class="table table-sm table-borderless">
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
            class="btn btn-outline-secondary button-remove"
            @click="remove(i)">
            &times;
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import ItemSelect from "./ItemSelect"
import jskos from "jskos-tools"
import { apiTypesScheme } from "../utils.js"

// Form to select an API endpoint
export default {
  components: { ItemSelect },
  props: {
    modelValue: {
      type: Array,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      apiTypesScheme,
      // deep copy of modelValue
      endpoints: this.modelValue.map(endpoint => ({...endpoint})),
      jskos,
    }
  },
  watch: {
    endpoints: {
      deep: true,
      immediate: true,
      handler(endpoints) {
        if(!endpoints.find(({ url}) => url.trim() === "")) {
          endpoints.push({ url:"", type: "http://bartoc.org/api-type/webservice" })
        }
        this.$emit("update:modelValue", endpoints)
      },
    },
  },
  methods: {
    remove(i) {
      this.endpoints.splice(i, 1)
    },
  },
}
</script>
