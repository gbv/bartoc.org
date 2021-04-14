<template>
  <ul
    v-for="type in noteTypes"
    :key="type"
    class="list-inline">
    <li
      v-for="note in notes(type)"
      :key="note"
      :title="type">
      <span
        class="language-tag"
        :lang="note.lang">{{ note.note }}</span>
    </li>
  </ul>
</template>

<script>
const noteTypeNames = [
  "scopeNote",
  "definition",
  "note",
  "historyNote",
  "editorialNote",
  "changeNote",
  "example",
]

export default {
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  computed: {
    noteTypes() {
      return noteTypeNames.filter(name => this.item[name])
    },
  },
  methods: {
    notes(type) {
      const languageMap = this.item[type] || {}
      const allNotes = []
      for (let lang in languageMap) {
        for (let note of languageMap[lang]) {
          allNotes.push({lang, note})
        }
      }
      return allNotes
    },
  },
}
</script>
