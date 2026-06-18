<template>
  <div>
    <span
      v-if="status === 'loading'"
      role="status"
      :aria-label="`Loading vocabularies listed by ${registryUri}`">
      <loading-indicator
        size="lg"
        aria-hidden="true" />
    </span>

    <template v-else-if="status === 'ready'">
      <template v-if="vocabularyCount">
        <ul
          v-if="vocabularies.length"
          class="list-unstyled">
          <li
            v-for="vocabulary in vocabularies"
            :key="vocabulary.uri">
            <a :href="vocabularyUrl(vocabulary)">
              {{ vocabularyLabel(vocabulary) }}
            </a>
          </li>
        </ul>

        <a
          v-if="vocabularyCount > vocabularies.length"
          :href="searchUrl">
          show all in BARTOC
        </a>
      </template>

      <template v-else>
        No vocabularies listed in BARTOC yet.
        <a :href="searchUrl">search in BARTOC</a>
      </template>
    </template>

    <a
      v-else
      :href="searchUrl">
      search in BARTOC
    </a>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"
import { LoadingIndicator } from "jskos-vue"

const props = defineProps({
  registryUri: {
    type: String,
    required: true,
  },
})

const previewLimit = 20
const status = ref("loading")
const vocabularies = ref([])
const vocabularyCount = ref(0)

// Keep the existing search entry point available even when the preview cannot load.
const searchUrl = computed(() =>
  `/vocabularies?${new URLSearchParams({ partOf: props.registryUri }).toString()}`,
)

// JSKOS labels can be plain strings or language maps. Prefer English when available.
function firstLabelValue(labels = {}) {
  if (typeof labels === "string") {
    return labels
  }

  const value = labels.en || Object.values(labels).find(Boolean)
  return Array.isArray(value) ? value[0] : value
}

function vocabularyLabel(vocabulary) {
  return firstLabelValue(vocabulary.prefLabel) ||
    vocabulary.notation?.[0] ||
    vocabulary.uri
}

function vocabularyUrl(vocabulary) {
  const id = vocabulary.uri?.match(/^http:\/\/bartoc\.org\/en\/node\/([1-9][0-9]*)$/)?.[1]
  return id ? `/en/node/${id}` : vocabulary.uri
}

function responseTotalCount(response) {
  const value = response.headers?.get("X-Total-Count")
  if (value === null || value === undefined) {
    return null
  }

  const count = Number(value)

  return Number.isInteger(count) && count >= 0 ? count : null
}

// Load a small preview from the API. The X-Total-Count header tells us whether
// the preview is complete or should link to the full BARTOC search result.
async function loadVocabularies() {
  try {
    const params = new URLSearchParams({
      partOf: props.registryUri,
      limit: String(previewLimit), // we ask only for a preview, so we can limit the number of results to reduce loading time
    })
    const response = await fetch(`/api/voc?${params.toString()}`)
    const items = await response.json()

    vocabularies.value = Array.isArray(items)
      ? items.filter(vocabulary => vocabulary?.uri)
      : []
    vocabularyCount.value = responseTotalCount(response) ?? vocabularies.value.length
    status.value = "ready"
  } catch {
    // Fall back to the plain search link when the preview cannot be loaded.
    status.value = "failed"
  }
}

onMounted(loadVocabularies)
</script>
