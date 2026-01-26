<template>
  <div class="concept-picker">
    <!-- Left column: free text input for searching -->
    <div class="search-col">
      <input
        ref="q"
        v-model="q"
        type="text"
        class="form-control"
        placeholder="Search or browse…"
        @keydown.esc.prevent="clear">
    </div>

    <!-- Right column: either search results or a browse tree -->
    <div class="panel-col border rounded">
      <!-- SEARCH MODE: active when the input is not empty -->
      <div
        v-if="q.trim()"
        class="panel left-space">
        <!-- Simple loading state -->
        <div
          v-if="loading"
          class="p-2 small text-muted">
          Searching…
        </div>

        <!-- Results list -->
        <ul
          v-else
          class="list-unstyled m-0">
          <!-- Empty state -->
          <li
            v-if="!results.length"
            class="p-2 small text-muted">
            No results.
          </li>

          <!-- Render each concept result -->
          <li
            v-for="c in results"
            :key="c.uri"
            class="row"
            :class="{ selected: c.uri === modelValue }"
            @click="pick(c.uri)">
            <ItemName
              :item="c"
              :notation="true" />
          </li>
        </ul>
      </div>

      <!-- BROWSE MODE: active when the input is empty -->
      <div
        v-else
        class="panel">
        <!-- Loading state while we fetch top concepts -->
        <div
          v-if="!topConcepts"
          class="p-2 small text-muted">
          Loading…
        </div>

        <!-- Tree view of concepts (top concepts + expandable narrower) -->
        <ConceptTree
          v-else
          v-model="selected"
          :concepts="topConcepts"
          class="tree"
          @open="loadNarrower"
          @select="onSelect" />
      </div>
    </div>
  </div>
</template>

<script>
import { ConceptTree } from "jskos-vue"
import ItemName from "./ItemName.vue"
import { registryForScheme, sortConcepts } from "../utils.js"

export default {
  name: "ConceptPicker",
  components: { ConceptTree, ItemName },
  props: {
    // JSKOS ConceptScheme (or a scheme-like object) we want to browse/search in
    scheme: { type: Object, required: true },

    // v-model value from parent: the currently selected concept URI
    modelValue: { type: String, default: "" },
  },
  emits: ["update:modelValue", "pick"],
  data() {
    return {
      // The text currently typed into the search input
      q: "",

      // Registry object from cocoda-sdk, derived from the scheme
      registry: null,

      // The scheme we actually use for API calls (sometimes identifier differs)
      accessScheme: null,

      // Top concepts for tree browsing (null = still loading)
      topConcepts: null,

      // Selected concept object for ConceptTree (we only store { uri })
      selected: null,

      // Search state
      loading: false,
      results: [],

      // Used to cancel previous searches (cocoda-sdk returns cancelable promises)
      cancel: null,

      // Used to debounce typing (avoid firing a request on every keypress)
      timer: null,
    }
  },
  watch: {
    // Keep internal "selected" in sync when parent changes v-model value
    modelValue(uri) {
      if (uri && (!this.selected || this.selected.uri !== uri)) {
        this.selected = { uri }
      }
      if (!uri) {
        this.selected = null
      }
    },

    // When the user types, debounce and then run a search
    q() {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        const s = this.q.trim()
        if (s) {
          this.search(s)
        } else {
          // Input cleared: reset search results and show browse tree again
          this.results = []
          this.loading = false
        }
      }, 150)
    },

    // When the scheme changes, reload registry + top concepts
    scheme: {
      deep: true,
      immediate: true,
      async handler() {
        await this.initRegistryAndTop()
      },
    },
  },
  methods: {
    // Clear the search input
    clear() {
      this.q = ""
    },

    // Select a concept URI and notify the parent
    pick(uri) {
      this.$emit("update:modelValue", uri)
      this.$emit("pick", uri)
    },

    // Handler for ConceptTree select event
    onSelect({ item }) {
      if (item?.uri) {
        this.pick(item.uri)
      }
    },

    // Initialize registry and load top concepts for browse mode
    async initRegistryAndTop() {
      // Reset state before loading
      this.topConcepts = null
      this.results = []
      this.loading = false

      // Some schemes might use a different URI in the API, so we try both
      const possibleUris = [this.scheme.uri, ...((this.scheme.identifier) || [])]

      for (const uri of possibleUris) {
        const accessScheme = { ...this.scheme, uri }
        const registry = registryForScheme(accessScheme)
        if (!registry) {
          continue
        }

        try {
          // Load top concepts for this scheme
          const top = await registry.getTop({ scheme: accessScheme })
          if (top?.length) {
            // Found a working scheme/registry combination
            this.registry = registry
            this.accessScheme = accessScheme
            this.topConcepts = sortConcepts(top, this.scheme)

            // If there is already a selected URI, reflect it in the tree
            if (this.modelValue) {
              this.selected = { uri: this.modelValue }
            }
            return
          }
        } catch (e) {
          // If this URI fails, we just try the next one
          console.error(e)
        }
      }

      // Fallback: registry exists, but the scheme has no top concepts (or none could be loaded)
      this.registry = registryForScheme(this.scheme)
      this.accessScheme = this.scheme
      this.topConcepts = []
    },

    // Lazy-load narrower concepts when a tree node is opened
    async loadNarrower(concept) {
      if (!concept?.uri) {
        return
      }

      // If narrower is already loaded (and does not contain "null"), do nothing
      if (concept.narrower && !concept.narrower.includes(null) && concept.narrower.length) {
        return
      }

      // Fetch direct children from our backend endpoint
      const res = await fetch(`/api/concepts/narrower?uri=${encodeURIComponent(concept.uri)}`)
      const kids = await res.json()

      // Store children on the concept object so ConceptTree can render them
      concept.narrower = sortConcepts(kids, this.scheme)
    },

    // Search for concepts using the registry
    async search(text) {
      if (!this.registry) {
        return
      }

      this.loading = true

      // Cancel the previous request if it is still running
      this.cancel && this.cancel("canceled")

      try {
        // cocoda-sdk search returns a cancelable promise
        const p = this.registry.search({ search: text, scheme: this.accessScheme })
        this.cancel = p.cancel

        const r = await p
        this.results = r || []
      } catch (e) {
        // Ignore canceled requests, log real errors
        if (e?.message !== "canceled") {
          console.error(e)
        }
        this.results = []
      } finally {
        this.loading = false
        this.cancel = null
      }
    },
  },
}
</script>

<style scoped>
/* Main layout: input on the left, panel on the right */
.concept-picker {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex-direction: column;
}

/* Let the input grow */
.search-col {
  flex: 1 1 auto;
  width: 100%;
}

/* Scroll container for results and tree */
.panel {
  max-height: 320px;
  overflow: auto;
}
.panel-col {
  flex: 1 1 auto;
  width: 100%;
}

/* Small padding to visually separate from border */
.left-space {
  padding-left: 12px;
}

/* Make the tree scroll too */
.tree {
  max-height: 320px;
  overflow-y: auto;
}

/* One row in the results list */
.row {
  padding: 6px 8px;
  cursor: pointer;
}

/* Hover effect */
.row:hover {
  background: #00000008;
}

/* Selected effect */
.row.selected {
  background: #fdbd58aa;
}
</style>
