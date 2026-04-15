<template>
  <!-- Show selected concepts before the search -->
  <div
    v-if="showSelected"
    class="selected-items">
    <item-selected
      v-model="selected"
      view="table"
      orderable
      removable />
  </div>

  <!-- Search and select concepts from one scheme -->
  <item-select
    :search="provider.search"
    :placeholder="placeholder"
    :show-tree="showTree"
    :tree-concepts="treeConcepts"
    :tree-load-narrower="provider.loadNarrower"
    @select="addSelected" />
</template>

<script setup>
import { onMounted, ref, watch } from "vue"
import { ItemSelect, ItemSelected } from "jskos-vue"

// Compare two lists by URI only.
function sameUris(a = [], b = []) {
  const aUris = a.map(i => i?.uri).filter(Boolean).sort()
  const bUris = b.map(i => i?.uri).filter(Boolean).sort()
  return JSON.stringify(aUris) === JSON.stringify(bUris)
}

const props = defineProps({
  // Current model value from the parent component.
  modelValue: {
    type: Array,
    default: () => [],
  },
  // Provider with API methods for this scheme.
  provider: {
    type: Object,
    required: true,
  },
  // Placeholder text for the search field.
  placeholder: {
    type: String,
    default: "",
  },
  // Show or hide the tree in item-select.
  showTree: {
    type: Boolean,
    default: true,
  },
  // Show or hide the selected items block.
  showSelected: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(["update:modelValue", "pick"])

// Top concepts for the tree.
const treeConcepts = ref([])

// Full selected concept objects.
const selected = ref([])

// Keep internal selected concepts in sync with the parent model value.
watch(
  () => props.modelValue,
  async (value) => {
    const currentModel = props.provider.toModel
      ? props.provider.toModel(selected.value)
      : selected.value

    // Do nothing if the URIs are the same.
    if (sameUris(value, currentModel)) {
      return
    }

    // Reload selected concepts from the new model value.
    selected.value = props.provider.loadSelected
      ? await props.provider.loadSelected(value)
      : [...value]
  },
  { deep: true },
)

// Emit model updates when selected concepts change.
watch(
  selected,
  (value) => {
    const model = props.provider.toModel
      ? props.provider.toModel(value)
      : value

    emit("update:modelValue", model)
  },
  { deep: true },
)

// Load top concepts and initial selected concepts on mount.
onMounted(async () => {
  treeConcepts.value = props.provider.loadTop
    ? await props.provider.loadTop()
    : []

  selected.value = props.provider.loadSelected
    ? await props.provider.loadSelected(props.modelValue)
    : [...props.modelValue]
})

// Add one selected concept if it is not already in the list.
function addSelected(item) {
  if (!item?.uri) {
    return
  }

  const exists = selected.value.some(i => i?.uri === item.uri)
  if (!exists) {
    selected.value = [...selected.value, item]
    emit("pick", item)
  }
}
</script>

<style scoped>
.selected-items {
  margin-top: 0.75rem;
  padding-bottom: 24px;
}

.selected-items :deep(.jskos-vue-itemSelected-table) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: none;
  border-radius: 0;
}

.selected-items :deep(.jskos-vue-itemSelected-row) {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: stretch;
  column-gap: 0.5rem;
  border: none;
}

.selected-items :deep(.jskos-vue-itemSelected-cell) {
  background: #fff;
  padding: 0.5rem 0.75rem;
  display: flex;
  align-items: center;
  min-width: 0;
  border: 1px solid #adb5bd;
  border-radius: 6px;
}

.selected-items :deep(.jskos-vue-itemSelected-actions) {
  display: flex;
  align-items: stretch;
}

.selected-items :deep(.jskos-vue-itemSelected-actionGroup) {
  display: flex;
  border-radius: 0;
  border: 1px solid #adb5bd;
  border-radius: 6px;
}

.selected-items :deep(.jskos-vue-itemSelected-actionBtn) {
  min-width: 38px;
  height: 100%;
  padding: 0;
  background: #fff;
  color: #6c757d;
  line-height: 1;
}

.selected-items :deep(.jskos-vue-itemSelected-actionBtn):nth-child(2) {
  border-left: 1px solid;
  border-right: 1px solid;
}

.selected-items :deep(.jskos-vue-itemSelected-actionBtn:hover:not(:disabled)) {
  background: #6c757d;
  color: #fff;
}

.selected-items :deep(.jskos-vue-itemSelected-actionBtn:disabled) {
  opacity: 0.5;
  cursor: default;
}

.selected-items :deep(.jskos-vue-itemName-notation) {
  font-weight: 600;
}

/* Center the arrow inside the button */
.selected-items :deep(.jskos-vue-arrow) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.selected-items :deep(.jskos-vue-arrow-up),
.selected-items :deep(.jskos-vue-arrow-down) {
  display: none;
}

.selected-items :deep(.jskos-vue-itemSelected-actionBtn[aria-label="Move up"] .jskos-vue-arrow)::before {
  content: "\25B2";
}

.selected-items :deep(.jskos-vue-itemSelected-actionBtn[aria-label="Move down"] .jskos-vue-arrow)::before {
  content: "\25BC";
}
</style>
