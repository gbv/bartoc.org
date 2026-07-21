<template>
  <h1>SPARQL Query</h1>

  <p>
    Queries are sent to <code>{{ endpoint }}</code>.
  </p>
</template>

<script setup>
defineOptions({ name: "SparqlPage" })

defineProps({
  endpoint: {
    type: String,
    required: true,
  },
})
</script>
