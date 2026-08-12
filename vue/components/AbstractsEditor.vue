<template>
  <div class="abstracts-editor">
    <div
      v-for="row in rows"
      :key="row.id"
      class="abstract-row">
      <div
        v-if="row.id !== 0"
        class="abstract-main">
        <textarea
          v-model="row.text"
          class="cc-form-control"
          rows="6"
          @input="emitValue"
          @blur="pruneEmptyRow(row.id)" />
        For copied text, use quotation marks and keep the original language.
      </div>

      <div
        v-if="row.id !== 0"
        class="abstract-side">
        <language-select
          v-model="row.lang"
          class="cc-form-control"
          :repeatable="false"
          :guess-from="row.text"
          @update:modelValue="emitValue" />

        <button
          type="button"
          class="cc-button cc-button-danger"
          @click="removeRow(row.id)">
          {{ rows.length > 1 ? "remove" : "clear" }} abstract
        </button>
      </div>
    </div>

    <div class="abstract-actions">
      <span
        v-if="showEnglishAbstractHint"
        class="abstract-hint alert alert-warning">
        Every terminology should have an English abstract at least.
      </span>
      <button
        type="button"
        :disabled="hasEmptyRequiredEnglishRow"
        class="cc-button cc-button-secondary"
        @click="addRow()">
        {{ addLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import LanguageSelect from "./LanguageSelect.vue"

// Convert the JSKOS definition object into editable rows.
function definitionToRows(definition = {}, { requireEnglish = false } = {}) {
  let id = 0

  const rows = []

  const entries = Object.entries(definition || {})
    .filter(([, values]) => Array.isArray(values))
    .sort(([a], [b]) => {
      if (a === "en") {
        return -1
      }
      if (b === "en") {
        return 1
      }
      return 0
    })

  for (const [lang, values] of entries) {
    for (const text of values) {
      rows.push({
        id: ++id,
        lang,
        text: text || "",
      })
    }
  }

  if (requireEnglish && !rows.some(row => row.lang === "en")) {
    rows.unshift({
      id: ++id,
      lang: "en",
      text: "",
    })
  }

  return rows
}

// Convert editable rows back into the JSKOS definition shape.
function rowsToDefinition(rows = []) {
  const definition = {}

  const sortedRows = [...rows].sort((a, b) => {
    if (a.lang === "en" && b.lang !== "en") {
      return -1
    }
    if (a.lang !== "en" && b.lang === "en") {
      return 1
    }
    return 0
  })

  for (const row of sortedRows) {
    const lang = (row.lang || "").trim()
    const text = row.text || ""

    if (!lang) {
      continue
    }
    if (!text.trim()) {
      continue
    }

    if (!definition[lang]) {
      definition[lang] = []
    }

    definition[lang].push(text)
  }

  return definition
}

const props = defineProps({
  // JSKOS definition, e.g. { en: ["..."], de: ["..."] }.
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  // New vocabularies should guide users toward an English abstract.
  requireEnglish: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["update:modelValue"])

// Local row state is easier to edit than the language-keyed JSKOS object.
const rows = ref(definitionToRows(props.modelValue, {
  requireEnglish: props.requireEnglish,
}))
const nextId = ref(Math.max(...rows.value.map(row => row.id), 0) + 1)

const addLabel = "add abstract"

const hasEnglishAbstract = computed(() =>
  rows.value.some(row => row.lang === "en" && row.text.trim()),
)

const showEnglishAbstractHint = computed(() =>
  props.requireEnglish && !hasEnglishAbstract.value,
)

const hasEmptyRequiredEnglishRow = computed(() =>
  props.requireEnglish &&
  rows.value.some(row => row.lang === "en" && !row.text.trim()),
)

// Keep local rows in sync if the parent replaces modelValue from outside.
watch(
  () => [props.modelValue, props.requireEnglish],
  ([value, requireEnglish]) => {
    const incoming = JSON.stringify(value || {})
    const current = JSON.stringify(rowsToDefinition(rows.value))
    const needsRequiredRow = requireEnglish &&
      !rows.value.some(row => row.lang === "en")

    if (incoming !== current || needsRequiredRow) {
      const nextRows = definitionToRows(value, { requireEnglish })
      rows.value = nextRows
      nextId.value = Math.max(...nextRows.map(row => row.id), 0) + 1
    }
  },
  { deep: true },
)

function emitValue() {
  ensureRequiredEnglishRow()
  emit("update:modelValue", rowsToDefinition(rows.value))
}

function ensureRequiredEnglishRow() {
  if (!props.requireEnglish || rows.value.some(row => row.lang === "en")) {
    return
  }

  rows.value.unshift({
    id: nextId.value,
    lang: "en",
    text: "",
  })
  nextId.value += 1
}

function addRow() {
  rows.value.push({
    id: nextId.value,
    lang: "",
    text: "",
  })
  nextId.value += 1
  emitValue()
}

function removeRow(id) {
  if (rows.value.length === 1) {
    clearRow(id)
    return
  }
  rows.value = rows.value.filter(row => row.id !== id)
  emitValue()
}

function clearRow(id) {
  const row = rows.value.find(row => row.id === id)

  if (!row) {
    return
  }

  row.text = ""
  emitValue()
}

function pruneEmptyRow(id) {
  const row = rows.value.find(row => row.id === id)
  if (!row) {
    return
  }

  if (!row.text.trim() && rows.value.length > 1) {
    removeRow(id)
    return
  }

  emitValue()
}
</script>

<style scoped>
.abstracts-editor {
  display: flex;
  flex-direction: column;
  gap: var(--cc-row-padding-x);
}

.abstract-row {
  display: flex;
  gap: var(--cc-space-sm);
  align-items: flex-start;
}

.abstract-main {
  flex: 1 1 auto;
}

.abstract-side {
  width: 240px;
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
  gap: var(--cc-space-md);
}

.abstract-side .cc-button {
  width: 60%;
  margin-left: auto;
}

.abstract-actions {
  display: flex;
  gap: var(--cc-row-padding-x);
  align-items: center;
  justify-content: flex-end;
}

.abstract-hint {
  color: var(--cc-color-muted);
  margin: 0;
  padding: var(--cc-space-sm);
}

.abstract-actions .cc-button {
  width: fit-content;
}
</style>
