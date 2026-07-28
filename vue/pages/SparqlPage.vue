<template>
  <h1>Knowledge Graph</h1>
  <p>
    Terminology metadata is merged into a knowledge graph with
    SPARQL API at <code>{{ endpoint }}</code>.
  </p>

  <div
    v-if="examples.length"
    class="example-query">
    <label for="sparql-example">Example query</label>
    <div class="example-query-controls">
      <select
        id="sparql-example"
        v-model="selectedExample"
        class="cc-form-control">
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
      <button
        type="button"
        class="cc-button cc-button-secondary"
        :disabled="!selectedExample || editorState !== 'ready' || queryState === 'running'"
        @click="loadExample">
        Load
      </button>
    </div>
  </div>

  <div
    v-if="editorState === 'loading'"
    class="sparql-editor-loading"
    role="status"
    aria-label="Loading SPARQL query editor…">
    <loading-indicator
      size="lg"
      aria-hidden="true" />
  </div>
  <p
    v-else-if="editorState === 'failed'"
    class="alert alert-danger"
    role="alert">
    The SPARQL query editor could not be loaded. Reload the page to try again.
  </p>

  <div
    v-show="editorState === 'ready'"
    ref="yasqeElement" />

  <div
    v-if="queryState === 'running'"
    class="query-status query-status-running"
    role="status"
    aria-live="polite">
    <loading-indicator
      size="md"
      aria-hidden="true" />
    <span>Running query…</span>
  </div>
  <p
    v-else-if="queryState === 'empty'"
    class="query-status text-muted"
    role="status"
    aria-live="polite">
    No results.
  </p>
  <p
    v-else-if="queryState === 'error'"
    class="query-status alert alert-danger"
    role="alert">
    Query failed. Check the query and try again.
  </p>

  <div
    v-show="editorState === 'ready' && ['idle', 'results'].includes(queryState)"
    ref="yasrElement"
    class="sparql-results" />
</template>
<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import { LoadingIndicator } from "jskos-vue"

// YASQE provides the SPARQL editor and request handling; YASR renders
// result sets and RDF responses.
// https://github.com/zazuko/Yasgui/tree/main/packages/yasqe
// https://github.com/zazuko/Yasgui/tree/main/packages/yasr
defineOptions({ name: "SparqlPage" })

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

// YASQE and YASR manage their own DOM, so Vue only provides their
// mounting elements.
const yasqeElement = ref(null)
const yasrElement = ref(null)
const selectedExample = ref("")
const editorState = ref("loading")
const queryState = ref("idle")

let yasqe
let yasr
let isUnmounted = false

function loadExample() {
  const example = props.examples[Number(selectedExample.value)]
  if (example) {
    // setValue only updates the editor; examples are never executed automatically.
    yasqe?.setValue(example.query)
  }
}

function startQuery() {
  queryState.value = "running"
}

function abortQuery() {
  queryState.value = "idle"
}

function responseIsEmpty(response) {
  const content = response.content?.trim() || ""
  const contentType = response.headers?.get?.("content-type") || ""

  if (!content) {
    return true
  }

  if (!contentType.includes("sparql-results+json")) {
    return false
  }

  const data = JSON.parse(content)

  // ASK false is a result, not an empty response.
  return !("boolean" in data) &&
    Array.isArray(data.results?.bindings) &&
    data.results.bindings.length === 0
}

async function showResponse(_instance, response, duration) {
  if (response instanceof Error) {
    queryState.value = "error"
    return
  }

  try {
    if (responseIsEmpty(response)) {
      queryState.value = "empty"
      return
    }
  } catch {
    queryState.value = "error"
    return
  }

  queryState.value = "results"
  await nextTick()
  yasr?.setResponse(response, duration)
}

onMounted(async () => {
  try {
    const [{ default: Yasqe }, { default: Yasr }] = await Promise.all([
      import("@zazuko/yasqe"),
      import("@zazuko/yasr"),
    ])

    if (isUnmounted) {
      return
    }

    yasqe = new Yasqe(yasqeElement.value, {
      value: "ASK {}",

      // Do not restore a previously saved query from browser storage.
      persistenceId: null,

      // Queries go directly from the browser to the configured public endpoint.
      requestConfig: {
        endpoint: props.endpoint,
        method: "POST",
      },
    })

    yasr = new Yasr(yasrElement.value, {
      // Do not restore previously rendered results from browser storage.
      persistenceId: null,
      prefixes: () => yasqe?.getPrefixesFromQuery() || {},
    })

    yasqe.on("query", startQuery)
    yasqe.on("queryAbort", abortQuery)
    yasqe.on("queryResponse", showResponse)
    editorState.value = "ready"

    // CodeMirror is initialized while its mount point is hidden. Recalculate its
    // layout after v-show has made it visible so the gutter does not cover the query.
    await nextTick()
    yasqe?.refresh()
  } catch (error) {
    console.error("Could not load the SPARQL query editor.", error)
    yasqe?.destroy()
    yasr?.destroy()
    yasqe = undefined
    yasr = undefined
    editorState.value = "failed"
  }
})

onBeforeUnmount(() => {
  isUnmounted = true

  // Remove our listener, abort pending requests and release DOM resources
  // managed by the two libraries.
  yasqe?.off("query", startQuery)
  yasqe?.off("queryAbort", abortQuery)
  yasqe?.off("queryResponse", showResponse)
  yasqe?.destroy()
  yasr?.destroy()

  yasqe = undefined
  yasr = undefined
})
</script>
<style scoped>
.example-query {
  margin-bottom: var(--cc-space-md);
}

.example-query-controls {
  display: flex;
  align-items: stretch;
  gap: var(--cc-space-sm);
  max-width: 36rem;
}

.example-query-controls select {
  flex: 1;
}

.sparql-editor-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.query-status {
  margin-top: var(--cc-space-md);
}

.query-status-running {
  display: flex;
  align-items: center;
  gap: var(--cc-space-sm);
}

:deep(.yasr .rowNumber) {
  margin-right: 0.75rem;
}
</style>
