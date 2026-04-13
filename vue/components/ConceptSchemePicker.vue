<template>
  <!-- Search and select concepts from one scheme -->
  <item-select
    :search="provider.search"
    :placeholder="placeholder"
    :show-tree="showTree"
    :tree-concepts="treeConcepts"
    :tree-load-narrower="provider.loadNarrower"
    @select="addSelected" />

  <!-- Show selected concepts below the search -->
  <div class="selected-items">
    <item-selected
      v-model="selected"
      view="list"
      removable />
  </div>
</template>

<script>
import { ItemSelect, ItemSelected } from "jskos-vue"

// Compare two lists by URI only.
function sameUris(a = [], b = []) {
  const aUris = a.map(i => i?.uri).filter(Boolean).sort()
  const bUris = b.map(i => i?.uri).filter(Boolean).sort()
  return JSON.stringify(aUris) === JSON.stringify(bUris)
}

/**
 * Generic picker for concepts from one scheme.
 * It uses a provider to load top concepts, selected concepts,
 * search results, and narrower concepts.
 */
export default {
  components: {
    ItemSelect,
    ItemSelected,
  },
  props: {
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
  },
  emits: ["update:modelValue"],
  data() {
    return {
      // Top concepts for the tree.
      treeConcepts: [],
      // Full selected concept objects.
      selected: [],
    }
  },
  watch: {
    modelValue: {
      deep: true,
      async handler(value) {
        const currentModel = this.provider.toModel
          ? this.provider.toModel(this.selected)
          : this.selected

        // Do nothing if the URIs are the same.
        if (sameUris(value, currentModel)) {
          return
        }

        // Reload selected concepts from the new model value.
        this.selected = this.provider.loadSelected
          ? await this.provider.loadSelected(value)
          : [...value]
      },
    },
    selected: {
      deep: true,
      handler(value) {
        const model = this.provider.toModel
          ? this.provider.toModel(value)
          : value

        // Send the updated model value to the parent.
        this.$emit("update:modelValue", model)
      },
    },
  },
  async created() {
    // Load tree concepts when the component starts.
    this.treeConcepts = this.provider.loadTop
      ? await this.provider.loadTop()
      : []

    // Load full selected concepts for the initial model value.
    this.selected = this.provider.loadSelected
      ? await this.provider.loadSelected(this.modelValue)
      : [...this.modelValue]
  },
  methods: {
    // Add one selected concept if it is not already in the list.
    addSelected(item) {
      if (!item?.uri) {
        return
      }
      const exists = this.selected.some(i => i?.uri === item.uri)
      if (!exists) {
        this.selected = [...this.selected, item]
      }
    },
  },
}
</script>
<style scoped>
.selected-items {
  margin-top: 0.75rem;
}

.selected-items :deep(.jskos-vue-itemList) {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.selected-items :deep(.jskos-vue-itemList-item) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.85rem;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  background: #fff;
}

.selected-items :deep(.jskos-vue-itemName-notation) {
  font-weight: 600;
  color: #0d6efd;
}

.selected-items :deep(.jskos-vue-itemSelected-listRemove) {
  border: none;
  background: transparent;
  color: #6c757d;
  font-size: 1.1rem;
  cursor: pointer;
}

.selected-items :deep(.jskos-vue-itemSelected-listRemove:hover) {
  color: #dc3545;
}
</style>

