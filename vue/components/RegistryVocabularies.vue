<template>
  <div>
    <span
      v-if="status === 'loading'"
      role="status"
      :aria-label="`Loading terminologies listed in ${registryUri}`">
      <loading-indicator
        size="lg"
        aria-hidden="true" />
    </span>

    <template v-else-if="status === 'ready'">
      <template v-if="terminologyCount">
        <ul
          v-if="terminologies.length"
          class="registry-vocabulary-list">
          <li
            v-for="terminology in terminologies"
            :key="terminology.uri">
            <a :href="terminologyUrl(terminology)">
              <item-name
                :item="terminology"
                :notation="false"
                :draggable="false" />
            </a>
          </li>
        </ul>

        <a
          v-if="terminologyCount > terminologies.length"
          :href="searchUrl"
          class="cc-button cc-button-action">
          show all ({{ terminologyCount }})
        </a>
      </template>

      <template v-else>
        No terminologies listed in BARTOC yet.
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
import { LoadingIndicator, ItemName } from "jskos-vue"

const props = defineProps({
  registryUri: {
    type: String,
    required: true,
  },
})

const previewLimit = 10
const status = ref("loading")
const terminologies = ref([])
const terminologyCount = ref(0)

// Keep the existing search entry point available even when the preview cannot load.
const searchUrl = computed(() =>
  `/vocabularies?${new URLSearchParams({ partOf: props.registryUri }).toString()}`,
)

function terminologyUrl(terminology) {
  const id = terminology.uri?.match(/^http:\/\/bartoc\.org\/en\/node\/([1-9][0-9]*)$/)?.[1]
  return id ? `/en/node/${id}` : terminology.uri
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
async function loadTerminologies() {
  try {
    const params = new URLSearchParams({
      partOf: props.registryUri,
      limit: String(previewLimit), // we ask only for a preview, so we can limit the number of results to reduce loading time
    })
    const response = await fetch(`/api/voc?${params.toString()}`)
    const items = await response.json()

    terminologies.value = Array.isArray(items)
      ? items.filter(terminology => terminology?.uri)
      : []
    terminologyCount.value = responseTotalCount(response) ?? terminologies.value.length
    status.value = "ready"
  } catch {
    // Fall back to the plain search link when the preview cannot be loaded.
    status.value = "failed"
  }
}

onMounted(loadTerminologies)
</script>

<style scoped>
.registry-vocabulary-list {
  padding-left: 0;
  list-style: none;
}
</style>
