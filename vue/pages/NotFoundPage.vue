<template>
  <p>
    Sorry, the resource could not be found!
    Are you <a href="/vocabularies">looking for vocabularies</a>?
  </p>
  <p>
    Search by URI:
  </p>
  <form
    action="/"
    method="get">
    <input
      type="text"
      name="uri">
    <input type="submit">
  </form>
</template>

<script setup>

defineOptions({ name: "NotFoundPage" })
</script>
