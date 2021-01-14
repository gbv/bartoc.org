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
        <item-input v-model="set[i]" />
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
          v-model="nextScheme"
          class="form-control">
          <option
            v-for="scheme in indexingSchemes"
            :key="scheme.uri"
            :value="scheme.uri">
            <item-name
              :item="scheme"
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
import { indexingSchemes, loadConcepts } from "../utils.js"

const ItemInput = {
  components: { ItemName },
  template: `
      <input v-show="hasFocus || !item.uri" @focus="hasFocus=true" @blur="hasFocus=false" ref="input" type="text" class="form-control" v-model="item.uri" v-on:keyup.enter="$event.target.blur()"/>
      <div v-if="!hasFocus" @click="edit()">
       <item-name :item="item" :notation="true"/>
      <a href="" @focus="edit()"/>
    </div>`,
  props: {
    modelValue: Object,
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
        this.$refs.input.focus()
      })
    },
    loadDetails() {
      const { uri, inScheme } = this.item
      loadConcepts("/api/data", uri).then(res => {
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
      nextScheme: indexingSchemes[0].uri,
      indexingSchemes,
    }
  },
  methods: {
    findScheme(uri) {
      return this.indexingSchemes.find(scheme => scheme.uri === uri)
    },
    add() {
      var inScheme = this.findScheme(this.nextScheme)
      inScheme = [{ uri: inScheme.uri }]
      this.set.push({ inScheme, uri: "" })
    },
  },
}
</script>
