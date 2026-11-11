<template>
  <!-- Use OrderedList to edit a list of strings. -->
  <div class="cc-list-editor">
    <OrderedList
      :model-value="rows"
      @update:model-value="updateRows">
      <template #default="{ item, update }">
        <input
          :value="item"
          type="text"
          class="cc-form-control"
          @input="update($event.target.value)">
      </template>
    </OrderedList>
    <button
      type="button"
      class="cc-button cc-button-secondary"
      @click="add">
      add entry
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue"
import OrderedList from "./OrderedList.vue"

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(["update:modelValue"])

// Keep empty rows here until the user enters a value.
const rows = ref([...props.modelValue])

function emitValues() {
  // Do not send empty rows to the parent.
  emit(
    "update:modelValue",
    rows.value.filter(value => typeof value === "string" && value.trim()),
  )
}

function add() {
  // Do not update the parent until the user enters a value.
  rows.value.push("")
}

function updateRows(value) {
  rows.value = value
  emitValues()
}
</script>

<style scoped>
.cc-list-editor > .cc-button {
  margin-top: var(--cc-space-xs);
}
</style>
