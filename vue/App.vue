<template>
  <TheHeader />
  <main class="app-container">
    <component
      :is="pageComponent"
      v-bind="pageProps" />
  </main>
  <TheFooter />
</template>

<script setup>
import TheFooter from "./components/TheFooter.vue"
import TheHeader from "./components/TheHeader.vue"

defineOptions({ name: "App" })

defineProps({
  pageComponent: {
    type: Object,
    required: true,
  },
  pageProps: {
    type: Object,
    default: () => ({}),
  },
})
</script>
