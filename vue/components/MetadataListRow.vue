<template>
  <MetadataRow
    :show="items.length > 0"
    :label="label"
    :icon="icon">
    <ul :class="['metadata-list', { 'separated-list': listStyle === 'inline' }]">
      <li
        v-for="(item, index) in items"
        :key="itemKey(item, index)">
        <slot
          name="item"
          :item="item">
          {{ item }}
        </slot>
      </li>
    </ul>
  </MetadataRow>
</template>

<script setup>
import MetadataRow from "./MetadataRow.vue"

defineOptions({ name: "MetadataListRow" })

defineProps({
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
})

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
</style>
