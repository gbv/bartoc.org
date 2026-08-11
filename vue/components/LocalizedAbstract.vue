<template>
  <template
    v-for="entry in paragraphs"
    :key="entry.key">
    <p
      :lang="entry.first ? entry.language : undefined"
      :class="entry.first ? 'language-tag' : undefined">
      {{ entry.text }}
    </p>
  </template>
</template>

<script setup>
import { computed } from "vue"

defineOptions({ name: "LocalizedAbstract" })

const props = defineProps({
  abstract: {
    type: Object,
    default: () => ({}),
  },
})

// Show one language tag per source value, including values split into multiple paragraphs.
const paragraphs = computed(() => Object.entries(props.abstract || {}).flatMap(
  ([language, values]) => (values || []).flatMap((value, valueIndex) =>
    String(value).split(/\n+/).map((text, paragraphIndex) => ({
      key: `${language}-${valueIndex}-${paragraphIndex}`,
      language,
      text,
      first: paragraphIndex === 0,
    })),
  ),
))
</script>
