<template>
  <!--
  List controls for any item type. The default slot shows each item and can
  replace it with `update`. This component only changes the array.
  -->
  <table
    v-if="modelValue.length"
    class="cc-table cc-table--compact">
    <tbody>
      <tr
        v-for="(item, index) in modelValue"
        :key="index">
        <td>
          <slot
            :item="item"
            :index="index"
            :update="value => update(index, value)" />
        </td>
        <td class="cc-ordered-list-actions">
          <div
            v-if="orderable || removable"
            class="cc-button-group">
            <button
              v-if="orderable"
              :disabled="!index"
              type="button"
              class="cc-button cc-button-secondary cc-button-icon"
              aria-label="Move up"
              @click="move(index, index - 1)">
              &#9650;
            </button>
            <button
              v-if="orderable"
              :disabled="index === modelValue.length - 1"
              type="button"
              class="cc-button cc-button-secondary cc-button-icon"
              aria-label="Move down"
              @click="move(index, index + 1)">
              &#9660;
            </button>
            <button
              v-if="removable"
              type="button"
              class="cc-button cc-button-secondary cc-button-icon"
              aria-label="Remove"
              @click="remove(index)">
              &times;
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  orderable: {
    type: Boolean,
    default: true,
  },
  removable: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(["update:modelValue"])

// Always emit a new array. The parent decides how to show each item.
function update(index, value) {
  const items = [...props.modelValue]
  items[index] = value
  emit("update:modelValue", items)
}

function remove(index) {
  const items = [...props.modelValue]
  items.splice(index, 1)
  emit("update:modelValue", items)
}

// Move an item without changing the parent array directly.
function move(from, to) {
  if (to < 0 || to >= props.modelValue.length) {
    return
  }

  const items = [...props.modelValue]
  items.splice(to, 0, items.splice(from, 1)[0])
  emit("update:modelValue", items)
}
</script>

<style scoped>
.cc-ordered-list-actions {
  width: 8.333%;
}
</style>
