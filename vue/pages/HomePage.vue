<template>
  <div class="homepage">
    <img
      :src="'/img/bartoc-logo.svg'"
      alt="BARTOC.org"
      style="width: 100%; max-width: 350px;">
    <VocabularySearch :schemes-count="schemesCount" />
    <div>
      BARTOC unites information about
      <b><a href="/vocabularies">terminologies</a></b>
      and <b><a href="/registries">terminology registries</a></b>
      to facilitate use of knowledge organization systems.
    </div>
  </div>
</template>

<script setup>
import VocabularySearch from "../components/VocabularySearch.vue"

defineOptions({ name: "HomePage" })

defineProps({
  schemesCount: { type: Number, required: true },
})
</script>
