<template>
  <div v-show="hasFocus || !item.uri">
    <subject-concept-picker
      ref="picker"
      v-model="item.uri"
      :scheme="scheme"
      @pick="hasFocus = false" />
  </div>

  <div
    v-if="!hasFocus && item.uri"
    class="itemInput"
    @click="edit()">
    <item-name
      :item="item"
      :notation="true" />
    <a
      href=""
      @focus="edit()" />
  </div>
</template>

<script>
import ItemName from "./ItemName.vue"
import SubjectConceptPicker from "./SubjectConceptPicker.vue"
import { cdkLoadConcepts } from "../utils.js"

/**
 * Input form with typeahead.
 */
export default {
  components: { ItemName, SubjectConceptPicker },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    scheme: {
      type: Object,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      item: this.modelValue || { inScheme: [this.scheme], uri: "" },
      hasFocus: false,
      loaded: null,
    }
  },
  watch: {
    item: {
      deep: true,
      handler(item) {
        this.$emit("update:modelValue", item)
        if (this.loaded !== item.uri) {
          this.loaded = item.uri
          this.loadDetails()
        }
      },
    },
  },
  created() {
    this.loadDetails()
  },
  methods: {
    edit() {
      this.hasFocus = true
      this.$nextTick(() => {
        this.$refs.input && this.$refs.input.focus()
      })
    },
    loadDetails() {
      const { uri, inScheme } = this.item
      cdkLoadConcepts(this.scheme, uri).then((res) => {
        this.item = res && res.length ? res[0] : { uri, inScheme }
      })
    },
  },
}
</script>

<style>
.itemInput {
  border: 1px solid #ced4da;
  padding: 0.375rem 0.75rem;
}
</style>
