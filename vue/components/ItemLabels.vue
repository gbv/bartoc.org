<template>
  <ul
    v-if="item.prefLabel"
    class="list-inline">
    <li
      v-for="(label, lang) in item.prefLabel"
      :key="lang">
      <span
        class="language-tag"
        :lang="lang">{{ label }}</span>
    </li>
  </ul>
  <!-- TODO: altLabel and hiddenLabel -->
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
}
</script>
