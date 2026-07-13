<template>
  <h1>{{ title }}</h1>

  <p>
    Sorry, we have some technical problems! Please contact the administrator and include the error message below.
  </p>

  <div class="jumbotron">
    {{ message }}
  </div>
</template>

<script setup>
defineOptions({ name: "ErrorPage" })

defineProps({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
})
</script>
