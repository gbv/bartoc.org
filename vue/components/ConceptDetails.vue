<template>
  <div class="concept-details">
    <ul class="ancestors">
      <li
        v-for="ancestor in ancestors.filter(Boolean).reverse()"
        :key="ancestor.uri"
        @click="selectConcept(ancestor)">
        <icon name="levelUp" />
        <item-name
          :item="ancestor"
          :notation="!display.hideNotation"
          class="clickable" />
      </li>
    </ul>
    <div v-if="selected">
      <div class="concept-details-selected">
        <item-name
          :item="selected"
          :notation="!display.hideNotation" />
        <a
          v-if="k10plus"
          :href="k10plus"
          class="concept-details-catalog-link"
          title="search in K10plus library catalog"
          target="k10plus">📚</a>
      </div>
      <div v-if="selected.uri || (selected.identifier||[]).length">
        <ul
          class="list-inline concept-details-identifiers">
          <li
            v-if="selected.uri"
            class="list-inline-item">
            <icon name="link" />
            <a :href="selected.uri">{{ selected.uri }}</a>
          </li>
          <li
            v-for="id in (selected.identifier||[])"
            :key="id"
            class="list-inline-item">
            {{ id }}
          </li>
        </ul>
      </div>
      <item-labels :item="selected" />
      <item-notes :item="selected" />
      <ul class="list-inline">
        <li
          v-if="selected.created"
          class="list-inline-item"
          title="created">
          <icon
            name="created"
            padding="" />
          {{ selected.created }}
        </li>
        <li
          v-if="selected.issued"
          class="list-inline-item"
          title="issued">
          <icon
            name="modified"
            padding="" />
          {{ selected.issued }}
        </li>
        <li
          v-if="selected.modified"
          class="list-inline-item"
          title="modified">
          <icon
            name="modified"
            padding="" />
          {{ selected.modified }}
        </li>
      </ul>
    </div>

    <div v-if="narrower">
      <ul class="narrower">
        <li
          v-for="child in narrower"
          :key="child.uri"
          @click="selectConcept(child)">
          <icon name="levelDown" />
          <item-name
            :item="child"
            :notation="!display.hideNotation"
            class="clickable" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import Icon from "./Icon.vue"
import ItemLabels from "./ItemLabels.vue"
import ItemName from "./ItemName.vue"
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

const selected = ref({})
const ancestors = ref([])
const narrower = ref([])

const k10plus = computed(() => {
  if (!selected.value || !selected.value.notation) {
    return
  }
  const ikt = k10plusikt[(props.scheme.CQLKEY || "").toUpperCase()]
  const notation = selected.value.notation || []
  return ikt ? `https://opac.k10plus.de/DB=2.299/CMD?ACT=SRCHA&IKT=${ikt}&TRM=${notation[0]}` : null
})

watch(
  () => props.concept,
  async (concept) => {
    selected.value = concept
    ancestors.value = []
    narrower.value = []

    if (concept && concept.uri) {
      // Load and merge details into the selected concept.
      const details = (await props.registry.getConcepts({ concepts: [concept] }))[0]
      selected.value = Object.assign(concept, details || {})

      // Inject access scheme. Required to get VOCID. Should better be fixed in cocoda-sdk?
      concept.inScheme = [props.scheme]

      ancestors.value = await props.registry.getAncestors({ concept })
      narrower.value = sortConcepts(
        await props.registry.getNarrower({ concept }),
        props.scheme,
      )
    }
  },
  { immediate: true },
)

function selectConcept(concept) {
  emit("update:concept", concept)
}
</script>

<style scoped>
ul.narrower {
  padding-top: var(--cc-space-md);
}
ul.narrower, ul.ancestors {
  list-style: none;
  padding-left: var(--cc-space-sm);
}
.clickable:hover {
  text-decoration: underline;
  cursor: pointer;
}
.concept-details-selected {
  font-size: var(--cc-font-size-lg);
}
.concept-details-catalog-link {
  padding-left: var(--cc-space-sm);
}
.concept-details-identifiers {
  margin-bottom: var(--cc-space-xs);
}
</style>
