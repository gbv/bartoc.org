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
      scheme: { uri: "http://bartoc.org/en/node/20287", API: "/api/" },
    }
  },
  computed: {
    /**
     * Passthrough model value.
     */
    value: {
      get() {
        return this.modelValue
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

<style src="@vueform/multiselect/themes/default.css"></style>
<style>
/* Adjust for Bootstrap CSS */
div.multiselect {
  border: 0;
  padding: 0;
}
div.multiselect-input, div.multiselect-options {
  border: 1px solid #ced4da;
}
div.multiselect-options {
  overflow-x: hidden;
}
div.multiselect.form-control {
  height: inherit;
}
</style>
