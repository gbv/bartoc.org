<template>
  <ul
    v-for="type in noteTypes"
    :key="type"
    class="item-note-list">
    <li
      v-for="note in notes(type)"
      :key="`${note.lang}:${note.note}`"
      :title="type">
      <span
        class="language-tag"
        :lang="note.lang">{{ note.note }}</span>
    </li>
  </ul>
</template>

<script setup>
import { computed } from "vue"

const noteTypeNames = [
  "scopeNote",
  "definition",
  "note",
  "historyNote",
  "editorialNote",
  "changeNote",
  "example",
]

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const noteTypes = computed(() => {
  return noteTypeNames.filter(name => props.item[name])
})

function notes(type) {
  const languageMap = props.item[type] || {}
  const allNotes = []
  for (let lang in languageMap) {
    for (let note of languageMap[lang]) {
      allNotes.push({lang, note})
    }
  }
  return allNotes
}

</script>

<style scoped>
.item-note-list {
  padding-left: 0;
  list-style: none;
}
</style>
