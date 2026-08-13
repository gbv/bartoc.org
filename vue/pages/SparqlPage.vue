<template>
  <h1>Knowledge Graph</h1>
  <p>
    Terminology metadata is merged into a knowledge graph with
    SPARQL API at <code>{{ endpoint }}</code>
    <span
      v-if="updatedAt">
      updated at
      <time :datetime="updatedAt">{{ formattedUpdatedAt() }}</time>.
    </span>
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
    class="cc-message cc-message--danger"
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

function disableGeoPlugin() {
  if (window.Yasr?.defaults?.plugins) {
    window.Yasr.defaults.plugins.Geo = false
  }
}

onMounted(() => {
  loadUpdatedAt()

  try {
    disableGeoPlugin()

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
  --yasgui-accent-color: var(--cc-color-primary);
  --yasgui-link-color: var(--cc-color-link);
  --yasgui-link-hover: var(--cc-color-primary-hover);
  --yasgui-button-hover: var(--cc-color-primary);
  --yasgui-input-focus: var(--cc-color-primary);
  --yasgui-button-text: var(--cc-color-text);
  --yasgui-input-border: var(--cc-border-color-control);
  --yasgui-border-color: var(--cc-border-color);
  --yasgui-bg-primary: var(--cc-color-surface);
  --yasgui-bg-secondary: var(--cc-color-surface-muted);
  --yasgui-graph-button-bg: var(--cc-color-primary);
  --yasgui-graph-button-hover: var(--cc-color-primary-hover);
  --yasgui-graph-button-text: var(--cc-color-on-primary);

  min-height: 800px;
  margin-bottom: var(--cc-space-xl);
}

.sparql-yasgui :deep(.yasqe_queryButton) {
  --yasgui-button-text: var(--cc-color-on-primary);

  border: 1px solid var(--cc-color-primary);
  border-radius: var(--cc-radius-sm);
  background: var(--cc-color-primary);
  color: var(--cc-color-on-primary);
}

.sparql-yasgui :deep(.yasqe_queryButton:hover),
.sparql-yasgui :deep(.yasqe_queryButton:focus-visible) {
  border-color: var(--cc-color-primary-hover);
  background: var(--cc-color-primary-hover);
}

.sparql-yasgui :deep(.yasqe_queryButton:focus-visible) {
  outline: 0;
  box-shadow: 0 0 0 0.2rem color-mix(in srgb, var(--cc-color-primary) 20%, transparent);
}

.sparql-yasgui :deep(.tabsList .tab.active > a) {
  border-bottom-color: var(--cc-color-primary);
}

.sparql-yasgui :deep(.tabPanel:not(.orientation-horizontal) > .yasrWrapperEl) {
  margin-top: var(--cc-space-md);
}

/* The endpoint is public page configuration, not a user-editable field. */
.sparql-yasgui :deep(.autocompleteWrapper),
.sparql-yasgui :deep(.endpointButtonsContainer) {
  display: none;
}
</style>
