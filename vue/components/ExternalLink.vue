<template>
  <a
    v-if="url"
    :href="url"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noopener noreferrer' : undefined">
    {{ label || url }}
  </a>
</template>

<script setup>
import { computed } from "vue"

defineOptions({ name: "ExternalLink" })

const props = defineProps({
  url: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "",
  },
})

const isExternal = computed(() => /^https?:\/\//i.test(props.url))
</script>
