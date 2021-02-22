<template>
  <item-select
    v-model="value"
    :repeatable="repeatable"
    :scheme="scheme"
    :extract-value="extractValue"
    :extract-label="extractLabel" />
</template>

<script>
import ItemSelect from "./ItemSelect"
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
      default: () => this.repeatable ? [] : "",
    },
    repeatable: {
      type: Boolean,
      default: false,
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
        return this.modelValue || "und"
      },
      set(val) {
        this.$emit("update:modelValue", val)
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
