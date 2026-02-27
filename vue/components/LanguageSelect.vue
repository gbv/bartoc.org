<template>
  <item-select
    v-model="value"
    :repeatable="repeatable"
    :scheme="scheme"
    :extract-value="extractValue"
    :extract-label="extractLabel"
    :placeholder="placeholder" />
</template>

<script>
import ItemSelect from "./ItemSelect.vue"
import jskos from "jskos-tools"

/**
 * Select one or a list of languages.
 *
 * Is simply a wrapper around ItemSelect since this is used in different places.
 */
export default {
  components: {
    ItemSelect,
  },
  props: {
    modelValue: {
      type: [String, Array],
      default: null,
    },
    repeatable: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: "Choose a language…",
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      // TODO: Do not hardcode this.
      scheme: {
        uri: "http://bartoc.org/en/node/20287",
        API: [{url:"/api/",type:"http://bartoc.org/api-type/jskos"}],
      },
    }
  },
  computed: {
    /**
     * Passthrough model value.
     */
    value: {
      get() {
        if (this.repeatable) {
        // always return array
          if (Array.isArray(this.modelValue)) {
            return this.modelValue
          }
          return this.modelValue ? [this.modelValue] : []
        }
        // always return string
        return typeof this.modelValue === "string" ? this.modelValue : ""
      },
      set(val) {
        if (this.repeatable) {
        // always emit array
          const arr = Array.isArray(val) ? val : (val ? [val] : [])
          this.$emit("update:modelValue", arr)
        } else {
        // always emit string
          this.$emit("update:modelValue", typeof val === "string" ? val : "")
        }
      },
    },
  },
  methods: {
    extractValue(concept) {
      return jskos.notation(concept)
    },
    extractLabel(concept) {
      return jskos.prefLabel(concept)
    },
  },
}
</script>
