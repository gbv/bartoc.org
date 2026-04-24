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
          class="form-control"
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
          class="form-control"
          :repeatable="false"
          :guess-from="row.text"
          @update:modelValue="emitValue" />

        <button
          type="button"
          class="btn btn-danger"
          @click="removeRow(row.id)">
          remove abstract
        </button>
      </div>
    </div>

    <button
      type="button"
      class="btn btn-primary"
      @click="addRow()">
      {{ addLabel }}
    </button>
  </div>
</template>

<script>
import LanguageSelect from "./LanguageSelect.vue"

function definitionToRows(definition = {}) {
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

  return rows
}

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

export default {
  name: "AbstractsEditor",
  components: {
    LanguageSelect,
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["update:modelValue"],
  data() {
    const rows = [...definitionToRows(this.modelValue)]

    return {
      rows,
      nextId: Math.max(...rows.map(row => row.id), 0) + 1,
    }
  },
  computed: {
    addLabel() {
      return this.rows.length > 1 ? "add another abstract" : "add abstract"
    },
  },
  watch: {
    modelValue: {
      deep: true,
      handler(value) {
        const incoming = JSON.stringify(value || {})
        const current = JSON.stringify(rowsToDefinition(this.rows))

        if (incoming !== current) {
          const rows = definitionToRows(value)
          this.rows = rows
          this.nextId = Math.max(...rows.map(row => row.id), 0) + 1
        }
      },
    },
  },
  methods: {
    emitValue() {
      this.$emit("update:modelValue", rowsToDefinition(this.rows))
    },
    addRow() {
      this.rows.push({
        id: this.nextId++,
        lang: "",
        text: "",
      })
      this.emitValue()
    },
    removeRow(id) {
      this.rows = this.rows.filter(row => row.id !== id)
      this.emitValue()
    },
    pruneEmptyRow(id) {
      const row = this.rows.find(row => row.id === id)
      if (!row) {
        return
      }

      if (!row.text.trim() && this.rows.length > 1) {
        this.removeRow(id)
        return
      }

      this.emitValue()
    },
  },
}
</script>

<style scoped>
.abstracts-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.abstract-row {
  display: flex;
  gap: 8px;
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
  gap: 16px;
}

.abstract-side .btn {
  width: 60%;
  margin-left: auto;
}

.abstracts-editor .btn {
  width: fit-content;
  margin-left: auto;
}
</style>
