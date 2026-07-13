<template>
  <Teleport to="#header-app">
    <TheHeader />
  </Teleport>
  <component
    :is="pageComponent"
    v-bind="pageProps" />
  <Teleport to="#footer-app">
    <TheFooter />
  </Teleport>
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
