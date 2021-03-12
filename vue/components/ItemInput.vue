<template>
  <item-select
    v-show="hasFocus || !item.uri"
    ref="input"
    v-model="item.uri"
    type="text"
    class="form-control"
    :scheme="scheme"
    @open="hasFocus=true"
    @close="hasFocus=false"
    @keyup.enter="$event.target.blur()" />
  <div
    v-if="!hasFocus"
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
import ItemSelect from "./ItemSelect"
import { cdkLoadConcepts } from "../utils.js"

// input form with typeahead
export default {
  components: { ItemName, ItemSelect },
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
      cdkLoadConcepts(this.scheme, uri).then(res => {
        this.item = res && res.length ? res[0] : { uri, inScheme }
      })
    },
  },
}
</script>
