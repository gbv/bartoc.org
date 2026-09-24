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
    :show-ancestors="false"
    :show-broader="false"
    :show-narrower="false"
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
      <!-- Show the hierarchy after the metadata with clear relation labels. -->
      <section
        v-if="broaderConcepts.length"
        class="cc-concept-relations cc-concept-broader">
        <h5>{{ broaderConcepts.length === 1 ? "Broader concept" : "Broader concepts" }}</h5>
        <ItemList
          v-bind="itemListOptions"
          :items="broaderConcepts"
          @select="emit('update:concept', $event.item)" />
      </section>
      <section
        v-if="narrowerConcepts.length"
        class="cc-concept-relations cc-concept-narrower">
        <h5>Narrower concepts</h5>
        <ItemList
          v-bind="itemListOptions"
          :items="narrowerConcepts"
          @select="emit('update:concept', $event.item)" />
      </section>
    </template>
  </ItemDetails>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import { ItemDetails, ItemList } from "jskos-vue"
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

// Show the full path without repeating broader concepts returned separately.
const broaderConcepts = computed(() => {
  const ancestors = (item.value?.ancestors || []).filter(Boolean)
  const broader = (item.value?.broader || [])
    .filter(concept => (
      concept && !ancestors.some(ancestor => ancestor.uri === concept.uri)
    ))

  return [...ancestors].reverse().concat(broader)
})

const narrowerConcepts = computed(() => item.value?.narrower || [])

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
.cc-concept-item-details :deep(.jskos-vue-itemDetails-list) {
  padding-left: 0;
  list-style: none;
}
.cc-concept-catalog-link {
  padding-left: var(--cc-space-sm);
}
.cc-concept-relations {
  margin-top: var(--cc-space-md);
}
.cc-concept-relations h5 {
  margin-bottom: var(--cc-space-xs);
  font-size: var(--cc-font-size-base);
  font-weight: var(--cc-font-weight-bold);
}
.cc-concept-item-details--hide-notation :deep(.jskos-vue-itemDetails-name .jskos-vue-itemName-notation) {
  display: none;
}
</style>
