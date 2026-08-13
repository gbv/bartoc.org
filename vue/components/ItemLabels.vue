<template>
  <ul
    v-if="item.prefLabel"
    class="item-label-list">
    <li
      v-for="(label, lang) in item.prefLabel"
      :key="lang">
      <span
        class="language-tag"
        :lang="lang">{{ label }}</span>
    </li>
  </ul>
  <ul
    v-if="item.altLabel"
    class="item-label-list">
    <template
      v-for="(labels, lang) in item.altLabel"
      :key="lang">
      <li
        v-for="label in labels"
        :key="`${lang}:${label}`">
        <span
          class="language-tag"
          :lang="lang">{{ label }}</span>
      </li>
    </template>
  </ul>
  <ul
    v-if="item.hiddenLabel"
    class="item-label-list">
    <template
      v-for="(labels, lang) in item.hiddenLabel"
      :key="lang">
      <li
        v-for="label in labels"
        :key="`${lang}:${label}`">
        <span
          class="language-tag"
          :lang="lang">{{ label }}</span>
      </li>
    </template>
  </ul>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const item = props.item

</script>

<style scoped>
.item-label-list {
  padding-left: 0;
  list-style: none;
}
</style>
