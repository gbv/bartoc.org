<template>
  <ItemDetails
    v-if="item?.uri"
    class="cc-concept-item-details"
    :class="{ 'cc-concept-item-details--hide-notation': display.hideNotation }"
    :item="item"
    flat
    :dropzone="false"
    :draggable="false"
    :fields="detailFields"
    :item-list-options="itemListOptions"
    @select="emit('update:concept', $event.item)">
    <template #afterName>
      <a
        v-if="k10plus"
        :href="k10plus"
        class="cc-concept-catalog-link"
        title="search in K10plus library catalog"
        target="k10plus">📚</a>
    </template>
    <template #afterTabs>
      <ItemNotes
        :item="item"
        :properties="additionalProperties" />
    </template>
  </ItemDetails>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import { ItemDetails } from "jskos-vue"
import ItemNotes from "./ItemNotes.vue"
import { sortConcepts } from "../utils.js"
import k10plusikt from "../../data/k10plus-ikt.json"

const props = defineProps({
  concept: {
    type: Object,
    required: true,
  },
  registry: {
    type: Object,
    required: true,
  },
  scheme: {
    type: Object,
    required: true,
  },
  display: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(["update:concept"])

const item = ref(null)

// The preferred label is already shown as the details heading.
const detailFields = { prefLabel: false }

// ItemDetails does not render these JSKOS language maps.
const additionalProperties = [
  "hiddenLabel",
  "note",
  "historyNote",
  "changeNote",
  "example",
]

// Disable drag and drop and follow the terminology notation setting.
const itemListOptions = computed(() => ({
  draggable: false,
  itemNameOptions: {
    draggable: false,
    showNotation: !props.display.hideNotation,
  },
}))

// Build a catalog search link when the scheme supports it.
const k10plus = computed(() => {
  const notation = item.value?.notation?.[0]
  const ikt = k10plusikt[(props.scheme.CQLKEY || "").toUpperCase()]

  return ikt && notation
    ? `https://opac.k10plus.de/DB=2.299/CMD?ACT=SRCHA&IKT=${ikt}&TRM=${notation}`
    : null
})

// ItemDetails reads ancestors and narrower concepts from the item itself.
// Load these relations together with the complete concept.
async function loadConcept(concept) {
  item.value = concept

  if (!concept?.uri) {
    return
  }

  const [details] = await props.registry.getConcepts({ concepts: [concept] })
  const loaded = { ...concept, ...(details || {}), inScheme: [props.scheme] }

  const [ancestors, narrower] = await Promise.all([
    props.registry.getAncestors({ concept: loaded }),
    props.registry.getNarrower({ concept: loaded }),
  ])

  item.value = {
    ...loaded,
    ancestors,
    narrower: sortConcepts(narrower, props.scheme),
  }
}

// Reload the item when the parent browser selects another concept.
watch(
  () => props.concept,
  loadConcept,
  { immediate: true },
)
</script>

<style scoped>
.cc-concept-item-details {
  --jskos-vue-fontSize-small: var(--cc-font-size-base);
}
.cc-concept-catalog-link {
  padding-left: var(--cc-space-sm);
}
.cc-concept-item-details--hide-notation :deep(.jskos-vue-itemDetails-name .jskos-vue-itemName-notation) {
  display: none;
}
</style>
