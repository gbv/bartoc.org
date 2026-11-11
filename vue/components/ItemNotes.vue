<template>
  <ul
    v-for="property in visibleProperties"
    :key="property"
    class="item-note-list">
    <li
      v-for="note in values(property)"
      :key="`${note.lang}:${note.note}`"
      :title="property">
      <span
        class="language-tag"
        :lang="note.lang">{{ note.note }}</span>
    </li>
  </ul>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  properties: {
    type: Array,
    // Limit the language maps when some fields are rendered elsewhere.
    default: () => [
      "scopeNote",
      "definition",
      "note",
      "historyNote",
      "editorialNote",
      "changeNote",
      "example",
    ],
  },
})

const visibleProperties = computed(() => {
  return props.properties.filter(name => props.item[name])
})

function values(property) {
  const languageMap = props.item[property] || {}
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
