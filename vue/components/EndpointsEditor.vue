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
            :scheme="apiTypes"
            :extract-label="extractLabel" />
        </td><td class="col-1">
          <button
            type="button"
            class="btn btn-outline-secondary button-remove"
            @click="remove(i)">
            🗙
          </button>
        </td>
      </tr>
      <tr>
        <td>
          <button
            type="button"
            class="btn btn-light button-add"
            @click="add()">
            ＋ Add API endpoint
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import ItemSelect from "./ItemSelect"
import jskos from "jskos-tools"

const apiTypes = {
  uri: "http://bartoc.org/en/node/20002",
  API:[
    {
      url: "/api/",
      type: "http://bartoc.org/api-type/jskos",
    },
  ],
}

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
      apiTypes,
      // deep copy of modelValue
      endpoints: this.modelValue.map(endpoint => ({...endpoint})),
    }
  },
  watch: {
    endpoints: {
      deep: true,
      handler(endpoints) {
        this.$emit("update:modelValue", endpoints)
      },
    },
  },
  methods: {
    add() {
      this.endpoints.push({ url:"", type: "http://bartoc.org/api-type/webservice" })
    },
    remove(i) {
      this.endpoints.splice(i, 1)
    },
    extractLabel(concept) {
      return jskos.prefLabel(concept)
    },
  },
}
</script>
