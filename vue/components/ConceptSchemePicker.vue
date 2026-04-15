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
    showSelected: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["update:modelValue", "pick"],
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
        this.$emit("pick", item)
      }
    },
  },
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

