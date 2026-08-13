<template>
  <ItemLink :item="item" />
  <small class="terminology-version-details">
    <template v-if="id"> ({{ id }})</template>
    <template v-if="item.startDate"> · since {{ item.startDate }}</template>
    <template v-if="item.extent"> · {{ item.extent }}</template>
  </small>
</template>

<script setup>
import { computed } from "vue"
import ItemLink from "./ItemLink.vue"

defineOptions({ name: "TerminologyVersionLink" })

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const id = computed(() => props.item.uri?.split("/").pop() || "")
</script>

<style scoped>
.terminology-version-details {
  color: var(--cc-color-muted);
}
</style>
