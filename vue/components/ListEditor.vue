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
          v-if="set.length > 1"
          type="button"
          class="btn btn-outline-secondary button-remove"
          @click="remove(i)">
          &times;
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
  watch: {
    set: {
      deep: true,
      immediate: true,
      handler(set) {
        if (set.find(e => e.trim() === "") === undefined) {
          set.push("")
        }
      },
    },
  },
}
</script>
