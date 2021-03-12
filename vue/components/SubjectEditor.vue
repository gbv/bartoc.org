<template>
  <table class="table table-sm table-borderless">
    <tr
      v-for="(subject,i) in set"
      :key="i">
      <td>
        <item-name
          v-if="subject.uri"
          :item="findScheme(subject.inScheme[0].uri)"
          :notation="true"
          :pref-label="false" />
        <select
          v-else
          v-model="subject.inScheme[0].uri"
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
      </td>
      <td class="item-input">
        <!-- use :key to force re-init of either subject uri or scheme changed -->
        <item-input
          :key="subject.uri + subject.inScheme[0].uri"
          v-model="set[i]"
          :scheme="findScheme(subject.inScheme[0].uri)" />
      </td><td>
        <div
          v-if="set.length > 1"
          class="btn-group">
          <button
            :disabled="!i"
            type="button"
            class="btn btn-outline-secondary"
            @click="up(i)">
            &#9650;
          </button>
          <button
            :disabled="i > set.length-2"
            type="button"
            class="btn btn-outline-secondary"
            @click="down(i)">
            &#9660;
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary"
            @click="remove(i)">
            &times;
          </button>
        </div>
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
    }
  },
  methods: {
    ensureEmpty() {
      if (!this.set.find(subject => !subject.uri)) {
        this.set.push({ inScheme: [ { uri: this.indexingSchemes[0].uri } ], uri: "" })
      }
    },
    findScheme(uri) {
      return this.indexingSchemes.find(scheme => jskos.compare(scheme, { uri }))
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
