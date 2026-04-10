<template>
  <table class="table table-sm table-borderless">
    <tbody>
      <tr>
        <td>
          <input
            v-model.trim="name"
            type="text"
            class="form-control">
        </td>
        <td>Name</td>
      </tr>
      <tr>
        <td>
          <input
            v-model.trim="uri"
            type="text"
            class="form-control"
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

<script>
import { isValidUrl } from "../utils.js"

function firstPublisher(modelValue) {
  return (modelValue || [])[0] || {}
}

export default {
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["update:modelValue"],
  data() {
    const publisher = firstPublisher(this.modelValue)
    return {
      name: (publisher.prefLabel || {}).en || "",
      uri: publisher.uri || "",
    }
  },
  computed: {
    uriInvalid() {
      return (this.uri || this.name) && !isValidUrl(this.uri)
    },
  },
  watch: {
    name() {
      this.emitValue()
    },
    uri() {
      this.emitValue()
    },
    modelValue: {
      deep: true,
      handler(value) {
        const publisher = firstPublisher(value)
        const nextName = (publisher.prefLabel || {}).en || ""
        const nextUri = publisher.uri || ""

        if (nextName !== this.name) {
          this.name = nextName
        }
        if (nextUri !== this.uri) {
          this.uri = nextUri
        }
      },
    },
  },
  methods: {
    emitValue() {
      const name = this.name.trim()
      const uri = this.uri.trim()
      if (name && uri) {
        const publisher = { uri, prefLabel: { en: name } }
        this.$emit("update:modelValue", [publisher])
      } else {
        this.$emit("update:modelValue", [])
      }
    },
  },
}
</script>
