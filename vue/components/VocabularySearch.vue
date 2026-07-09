<template>
  <div class="vocabulary-search">
    <BartocSearchBar
      v-model:search="search"
      v-model:field="field"
      @submit="submitSearch">
      <template
        v-if="hasSchemesCount"
        #summary>
        <strong class="vocabulary-search__summary-text">
          Search in metadata about
          <span>{{ schemesCount }}</span>
          terminologies
        </strong>
      </template>
    </BartocSearchBar>
  </div>
</template>

<script setup>
import { computed, ref } from "vue"
import { BartocSearchBar } from "@gbv/bartoc-components"

defineOptions({ name: "VocabularySearch" })

const props = defineProps({
  query: {
    type: Object,
    default: () => ({}),
  },
  schemesCount: { type: Number, default: null },
})

const { search: initialSearch, field: initialField = "" } = props.query
const search = ref(initialSearch || "")
const field = ref(initialField)

const hasSchemesCount = computed(() => props.schemesCount !== 0 && props.schemesCount !== null)

function submitSearch(query) {
  const params = new URLSearchParams(
    Object.entries(query).filter(([, value]) => value),
  )
  const queryString = params.toString()

  window.location.href = `/vocabularies${queryString ? `?${queryString}` : ""}`
}
</script>
