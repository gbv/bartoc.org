<template>
  <table class="table table-sm table-borderless">
    <tr
      v-for="(entry,i) in set"
      :key="i">
      <td>
        <input
          v-model="set[i]"
          type="text"
          class="form-control">
      </td><td>
        <button
          type="button"
          class="btn btn-outline-secondary button-remove"
          @click="remove(i)">
          🗙
        </button>
      </td>
    </tr><tr>
      <td>
        <button
          type="button"
          class="btn btn-light button-add"
          @click="add('')">
          ＋ Add {{ name }}
        </button>
      </td>
    </tr>
  </table>
</template>

<script>
import SetEditorMixin from "./SetEditorMixin.js"

/**
 * Edit a list of strings.
 */
export default {
  mixins: [SetEditorMixin],
  props: {
    name: {
      type: String,
      default: "",
    },
  },
  mounted() {
    // to show at least one text input for the first entry
    if (!this.set.length) {
      this.add("")
    }
  },
}
</script>
