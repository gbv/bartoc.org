<template>
  <ItemLink :item="item" />
  <small
    v-if="details.length"
    class="terminology-version-details">
    {{ ` ${details.join(" · ")}` }}
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
const details = computed(() => [
  props.item.startDate ? `since ${props.item.startDate}` : "",
  props.item.extent,
  id.value ? `BARTOC ID ${id.value}` : "",
].filter(Boolean))
</script>

<style scoped>
.terminology-version-details {
  color: var(--cc-color-muted);
}
</style>
