<template>
  <table class="table table-sm table-borderless">
    <tr
      v-for="(subject,i) in set"
      :key="i">
      <td v-if="(subject.inScheme||[]).length">
        <item-name
          :item="findScheme(subject.inScheme[0].uri)"
          :notation="true"
          :pref-label="false" />
      </td>
      <td v-else>
        ?
      </td>
      <td class="item-input">
        <item-input
          v-model="set[i]"
          :scheme="findScheme(subject.inScheme[0].uri)" />
      </td><td>
        <button
          type="button"
          class="btn btn-outline-primary"
          @click="remove(i)">
          x
        </button>
      </td>
    </tr><tr>
      <td>
        <select
          v-model="schemeUri"
          class="form-control">
          <option
            v-for="s in indexingSchemes"
            :key="s.uri"
            :value="s.uri">
            <item-name
              :item="s"
              :notation="true"
              :pref-label="false" />
          </option>
        </select>
      </td><td>
        <button
          type="button"
          class="btn btn-outline-primary"
          @click="add()">
          +
        </button>
        Please use concept URIs (unless <a href="https://github.com/gbv/bartoc.org/issues/12">this issue</a> is solved)!
      </td>
    </tr>
  </table>
</template>

<script>
import SetEditorMixin from "./SetEditorMixin.js"
import ItemName from "./ItemName.vue"
import ItemSelect from "./ItemSelect"
import { indexingSchemes, cdkLoadConcepts } from "../utils.js"
import jskos from "jskos-tools"

const ItemInput = {
  components: { ItemName, ItemSelect },
  template: `
      <item-select v-show="hasFocus || !item.uri" @open="hasFocus=true" @close="hasFocus=false" ref="input" type="text" class="form-control" v-model="item.uri" v-on:keyup.enter="$event.target.blur()" :scheme="scheme" />
      <div v-if="!hasFocus" @click="edit()">
       <item-name :item="item" :notation="true"/>
      <a href="" @focus="edit()"/>
    </div>`,
  props: {
    modelValue: Object,
    scheme: Object,
  },
  data() {
    return {
      item: this.modelValue,
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
        this.item = res[0] || { uri, inScheme }
      })
    },
  },
}

export default {
  components: { ItemInput, ItemName },
  mixins: [SetEditorMixin],
  data() {
    return {
      indexingSchemes,
      schemeUri: indexingSchemes[0].uri,
    }
  },
  computed: {
    scheme() {
      return this.findScheme(this.schemeUri)
    },
  },
  methods: {
    findScheme(uri) {
      return this.indexingSchemes.find(scheme => jskos.compare(scheme, { uri }))
    },
    add() {
      var inScheme = this.scheme
      inScheme = [{ uri: inScheme.uri }]
      this.set.push({ inScheme, uri: "" })
    },
  },
}
</script>
