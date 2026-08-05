<template>
  <h1>Knowledge Graph</h1>
  <p>
    Terminology metadata is merged into a knowledge graph with
    SPARQL API at <code>{{ endpoint }}</code>.
  </p>
  <p
    v-if="updatedAt"
    class="sparql-last-updated text-muted">
    Knowledge graph last updated:
    <time :datetime="updatedAt">{{ formattedUpdatedAt() }}</time>.
  </p>

  <div
    v-if="examples.length"
    class="example-query">
    <label for="sparql-example">Example queries</label>
    <select
      id="sparql-example"
      class="cc-form-control"
      value=""
      @change="loadExample">
      <option
        value=""
        disabled>
        Select an example
      </option>
      <option
        v-for="(example, index) in examples"
        :key="index"
        :value="String(index)">
        {{ example.label }}
      </option>
    </select>
  </div>

  <p
    v-if="editorFailed"
    class="alert alert-danger"
    role="alert">
    The SPARQL query editor could not be loaded. Reload the page to try again.
  </p>

  <div
    v-else
    ref="yasguiElement"
    class="sparql-yasgui" />
</template>
<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue"

const props = defineProps({
  endpoint: {
    type: String,
    required: true,
  },
  examples: {
    type: Array,
    default: () => [],
  },
})

const yasguiElement = ref(null)
const editorFailed = ref(false)
const updatedAt = ref("")
let yasgui

function formattedUpdatedAt() {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(updatedAt.value))
}

// The graph metadata contains the timestamp of the latest completed import.
const updatedAtQuery = `
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?updated {
  GRAPH <https://bartoc.org/graph/terminology/> {
    <https://bartoc.org/graph/terminology/> dct:modified ?updated
  }
}
ORDER BY DESC(?updated)
LIMIT 1
`

async function loadUpdatedAt() {
  try {
    // The query is short enough for GET, which keeps the request simple.
    const url = new URL(props.endpoint)
    url.searchParams.set("query", updatedAtQuery)

    const response = await fetch(url, {
      headers: {
        Accept: "application/sparql-results+json",
      },
    })

    if (!response.ok) {
      return
    }

    const data = await response.json()
    const timestamp = data.results?.bindings?.[0]?.updated?.value || ""
    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp)
    updatedAt.value = timestamp && !hasTimezone ? `${timestamp}Z` : timestamp
  } catch (error) {
    console.warn("Could not load the knowledge graph update time.", error)
  }
}

function loadExample(event) {
  const example = props.examples[event.target.value]
  if (example) {
    yasgui?.getTab()?.setQuery(example.query)
  }
}

onMounted(() => {
  loadUpdatedAt()

  try {
    yasgui = new window.Yasgui(yasguiElement.value, {
      autofocus: false,
      persistenceId: null,
      populateFromUrl: false,
      requestConfig: {
        endpoint: props.endpoint,
        method: "POST",
      },
      endpointCatalogueOptions: {
        getData: () => [{ endpoint: props.endpoint }],
      },
      yasqe: {
        value: "ASK {}",
      },
    })
  } catch (error) {
    console.error("Could not load the SPARQL query editor.", error)
    editorFailed.value = true
  }
})

onBeforeUnmount(() => {
  yasgui?.destroy()
})
</script>
<style scoped>
.example-query {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--cc-space-sm);
  margin-bottom: var(--cc-space-md);
}

.example-query select {
  flex: 0 1 20rem;
  min-width: 0;
}

.example-query label {
  margin: 0;
}

.sparql-yasgui {
  min-height: 800px;
}

/* The endpoint is public page configuration, not a user-editable field. */
.sparql-yasgui :deep(.autocompleteWrapper),
.sparql-yasgui :deep(.endpointButtonsContainer) {
  display: none;
}
</style>
