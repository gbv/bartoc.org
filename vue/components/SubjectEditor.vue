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
      </td>
    </tr>
  </table>
</template>

<script>
import SetEditorMixin from "./SetEditorMixin.js"
import ItemName from "./ItemName"
import ItemInput from "./ItemInput"
import { indexingSchemes } from "../utils.js"
import jskos from "jskos-tools"

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

<style scoped>
table {
  margin-bottom: 0;
}
table tr td {
  vertical-align: middle;
  padding: 0;
}
table tr td > span {
  padding-left: 0.5rem;
}
table tr td:first-child {
  min-width: 130px;
}
table tr td:nth-child(2) {
  width: 100%;
  padding-left: 0.5rem;
}
table tr td:nth-child(3) {
  padding-left: 0.5rem;
}
table tr td {
  padding-bottom: 5px;
}
table tr:last-child td {
  padding-bottom: 0;
}
</style>
