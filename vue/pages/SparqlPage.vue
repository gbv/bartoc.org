<template>
  <h1>Knowledge Graph</h1>
  <p>
    Terminology metadata is merged into a knowledge graph with
    SPARQL API at <code>{{ endpoint }}</code>
    <span
      v-if="updatedAt">
      updated at
      <time :datetime="updatedAt">{{ formatTimestamp(updatedAt) }}</time>.
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
    ref="matguiElement"
    class="sparql-matgui" />
</template>
<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue"
import { formatTimestamp } from "../utils.js"

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

const matguiElement = ref(null)
const editorFailed = ref(false)
const updatedAt = ref("")
let matgui

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
    matgui?.getTab()?.setQuery(example.query)
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

    matgui = new window.Yasgui(matguiElement.value, {
      autofocus: false,
      persistenceId: null,
      populateFromUrl: false,
      quickStartOnFirstVisit: false,
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
  matgui?.destroy()
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

.sparql-matgui {
  /* MatGUI still uses yasgui-* names for its theme variables. */
  --yasgui-surface: var(--cc-color-page);
  --yasgui-surface-raised: var(--cc-color-surface);
  --yasgui-surface-sunken: var(--cc-color-surface-muted);
  --yasgui-surface-selected: var(--cc-color-accent);
  --yasgui-nav-bg: var(--cc-color-page);
  --yasgui-ink: var(--cc-color-text);
  --yasgui-ink-body: var(--cc-color-text);
  --yasgui-ink-muted: var(--cc-color-muted);
  --yasgui-line: var(--cc-border-color);
  --yasgui-brand: var(--cc-color-primary);
  --yasgui-brand-fill: var(--cc-color-primary);
  --yasgui-brand-fill-strong: var(--cc-color-link);
  --yasgui-brand-strong: var(--cc-color-link);
  --yasgui-brand-soft: var(--cc-color-accent);
  --yasgui-on-brand: var(--cc-color-on-primary);
  --yasgui-focus: var(--cc-color-primary);
  --yasgui-accent-color: var(--cc-color-primary);
  --yasgui-accent-bg: var(--cc-color-accent);
  --yasgui-link-color: var(--cc-color-link);
  --yasgui-link-hover: var(--cc-color-primary);
  --yasgui-input-focus: var(--cc-color-primary);
  --yasgui-input-border: var(--cc-border-color-control);
  --yasgui-bg-primary: var(--cc-color-surface);
  --yasgui-bg-secondary: var(--cc-color-page);
  --yasgui-border-color: var(--cc-border-color);
  --yasgui-font-family: inherit;
  --yasgui-radius-sm: var(--cc-radius-sm);
  --yasgui-radius-md: var(--cc-radius-md);
  --yasgui-radius-lg: var(--cc-radius-lg);
  --yasgui-radius-button: var(--cc-radius-sm);
  --yasgui-graph-button-bg: var(--cc-color-primary);
  --yasgui-graph-button-hover: var(--cc-color-link);
  --yasgui-graph-button-text: var(--cc-color-on-primary);

  min-height: 800px;
  margin-bottom: var(--cc-space-xl);
}

/* The endpoint is public page configuration, not a user-editable field. */
.sparql-matgui :deep(.autocompleteWrapper) {
  display: none;
}

.sparql-matgui :deep(.yasgui-graph-settings-panel) {
  --yasgui-text-primary: var(--cc-color-text);
  --yasgui-text-secondary: var(--cc-color-muted);
  --yasgui-border-color: var(--cc-border-color-control);

  background: var(--cc-color-surface);
  color: var(--cc-color-text);
  border-radius: var(--cc-radius-md);
  box-shadow: var(--cc-shadow-md);
  font-size: var(--cc-font-size-sm);
}

.sparql-matgui :deep(.yasgui-graph-settings-section) {
  font-size: var(--cc-font-size-sm);
}

.sparql-matgui :deep(.yasgui-graph-settings-select) {
  font-size: var(--cc-font-size-sm);
  padding: var(--cc-space-xs) var(--cc-space-sm);
  border-radius: var(--cc-radius-sm);
}

.sparql-matgui :deep(.yasgui-graph-settings-row input[type="checkbox"] + span) {
  margin-right: auto;
}
</style>
