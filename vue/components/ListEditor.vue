<template>
  <table class="table table-sm table-borderless">
    <tbody>
      <tr
        v-for="(entry,i) in set"
        :key="i">
        <td>
          <input
            v-model="set[i]"
            type="text"
            class="form-control">
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
    </tbody>
  </table>
</template>

<script>
import SetEditorMixin from "./SetEditorMixin.js"

/**
 * Edit a list of strings.
 */
export default {
  mixins: [SetEditorMixin],
  methods: {
    ensureEmpty() {
      if (this.set.find(e => e.trim() === "") === undefined) {
        this.set.push("")
      }
    },
  },
}
</script>

<style>
button.btn.btn-outline-secondary:disabled {
  color: #fff;
}
</style>
