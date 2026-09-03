<template>
  <MetadataRow
    :show="items.length > 0"
    :label="label"
    :icon="icon"
    :source-field="sourceField">
    <ul :class="['metadata-list', { 'separated-list': listStyle === 'inline' }]">
      <li
        v-for="(item, index) in displayedItems"
        :key="itemKey(item, index)">
        <slot
          name="item"
          :item="item">
          {{ item }}
        </slot>
      </li>
    </ul>
    <button
      v-if="hasHiddenItems"
      type="button"
      class="metadata-list-toggle"
      :aria-expanded="isExpanded"
      @click="isExpanded = !isExpanded">
      {{ isExpanded ? "show less" : `show all (${items.length})` }}
    </button>
    <!-- Optional context such as field provenance belongs beside the values. -->
    <slot name="note" />
  </MetadataRow>
</template>

<script setup>
import { computed, ref } from "vue"
import MetadataRow from "./MetadataRow.vue"

defineOptions({ name: "MetadataListRow" })

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: "",
  },
  items: {
    type: Array,
    default: () => [],
  },
  listStyle: {
    type: String,
    default: "unstyled",
    validator: value => ["inline", "unstyled"].includes(value),
  },
  previewLimit: {
    type: Number,
    default: 0,
  },
  sourceField: {
    // Forward the JSKOS source identity to MetadataRow for provenance lookup.
    type: [String, Array],
    default: "",
  },
})

// Keep long lists short until the user asks to see every item.
const isExpanded = ref(false)
const hasHiddenItems = computed(() => (
  props.previewLimit > 0 && props.items.length > props.previewLimit
))

// A limit of zero keeps the normal behavior and displays the full list.
const displayedItems = computed(() => (
  hasHiddenItems.value && !isExpanded.value
    ? props.items.slice(0, props.previewLimit)
    : props.items
))

function itemKey(item, index) {
  return item && typeof item === "object"
    ? item.uri || item.url || index
    : `${item}-${index}`
}
</script>

<style scoped>
.metadata-list {
  padding-left: 0;
  list-style: none;
}

.metadata-list-toggle {
  margin-top: var(--cc-space-sm);
  padding: 0;
  border: 0;
  color: var(--cc-color-link);
  font: inherit;
  background: none;
  cursor: pointer;
}

.metadata-list-toggle:hover {
  text-decoration: underline;
}
</style>
