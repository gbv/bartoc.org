<template>
  <div class="terminology-relation-editor">
    <div
      v-if="selected.length"
      class="selected-items">
      <item-selected
        v-model="selected"
        view="table"
        removable />
    </div>

    <item-select
      :search="searchTerminologies"
      :placeholder="placeholder"
      :show-tree="false"
      @select="addSelected" />
  </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { ItemSelect, ItemSelected } from "jskos-vue"
import { sameUris, toTerminologySelectedItem } from "../utils"


const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  multiple: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    default: "Search BARTOC terminologies…",
  },
})

const emit = defineEmits(["update:modelValue"])

// Keep only one item if multiple=false, and remove duplicates by URI.
function normalizeSelection(items, multiple) {
  const seen = new Set()
  const unique = []

  for (const item of items || []) {
    if (!item?.uri || seen.has(item.uri)) {
      continue
    }
    seen.add(item.uri)
    unique.push(item)
  }

  return multiple ? unique : unique.slice(0, 1)
}

// Full selected terminology records for the UI.
const selected = ref([])

// Load one full BARTOC terminology record by URI.
async function loadTerminology(uri) {
  if (!uri) {
    return null
  }

  const url = new URL("/api/voc", window.location.origin)
  url.searchParams.set("uri", uri)

  const res = await fetch(url)
  if (!res.ok) {
    return null
  }

  const data = await res.json()
  return Array.isArray(data) && data.length ? data[0] : null
}

// Load current modelValue into full UI items.
async function loadSelected(value) {
  const uris = (value || []).map(item => item?.uri).filter(Boolean)
  if (!uris.length) {
    return []
  }

  const loaded = await Promise.all(
    uris.map(uri => loadTerminology(uri).catch(() => null)),
  )

  return normalizeSelection(
    loaded.filter(Boolean).map(toTerminologySelectedItem),
    props.multiple,
  )
}

// OpenSearch suggest over BARTOC terminologies.
async function searchTerminologies(search) {
  const query = (search || "").trim()
  if (!query) {
    return ["", [], [], []]
  }

  const url = new URL("/api/voc/suggest", window.location.origin)
  url.searchParams.set("search", query)

  const res = await fetch(url)
  if (!res.ok) {
    return [query, [], [], []]
  }

  return await res.json()
}

// We load the full record so ItemSelected can show a proper label.
// Add one terminology from the autocomplete selection.
async function addSelected(item) {
  if (!item?.uri) {
    return
  }

  const full = await loadTerminology(item.uri)
  const nextItem = full ? toTerminologySelectedItem(full) : item

  if (props.multiple) {
    selected.value = normalizeSelection(
      [...selected.value, nextItem],
      true,
    )
  } else {
    selected.value = normalizeSelection([nextItem], false)
  }
}

// Keep local UI state in sync with parent value.
watch(
  () => props.modelValue,
  async (value) => {
    const normalizedValue = normalizeSelection(value, props.multiple)

    if (sameUris(normalizedValue, selected.value)) {
      return
    }

    selected.value = await loadSelected(normalizedValue)
  },
  { deep: true, immediate: true },
)

// Emit back minimal JSKOS-like references.
watch(
  selected,
  (value) => {
    const normalized = normalizeSelection(value, props.multiple)
      .map(({ uri }) => ({ uri }))

    emit("update:modelValue", normalized)
  },
  { deep: true },
)
</script>

<style scoped>
.terminology-relation-editor {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.selected-items {
  padding-top: 0.25rem;
}
</style>
