<template>
  <table class="cc-table cc-table--compact">
    <tbody>
      <tr
        v-for="(entry,i) in set"
        :key="i">
        <td>
          <input
            v-model="set[i]"
            type="text"
            class="cc-form-control">
        </td><td>
          <div
            v-if="set.length > 1"
            class="cc-button-group">
            <button
              :disabled="!i"
              type="button"
              class="cc-button cc-button-secondary cc-button-icon"
              @click="up(i)">
              &#9650;
            </button>
            <button
              :disabled="i > set.length-2"
              type="button"
              class="cc-button cc-button-secondary cc-button-icon"
              @click="down(i)">
              &#9660;
            </button>
            <button
              type="button"
              class="cc-button cc-button-secondary cc-button-icon"
              @click="remove(i)">
              &times;
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { useSetEditor } from "../composables/useSetEditor.js"

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(["update:modelValue"])

function ensureEmpty(set) {
  if (set.value.find(e => e.trim() === "") === undefined) {
    set.value.push("")
  }
}

const { set, remove, up, down } = useSetEditor(props, emit, ensureEmpty)

</script>
