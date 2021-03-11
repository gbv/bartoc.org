<template>
  <div class="concept-details">
    <ul class="ancestors">
      <li
        class="clickable"
        @click="$emit('update:concept', null)">
        top concepts
      </li>
      <li
        v-for="ancestor in ancestors"
        :key="ancestor.uri"
        @click="$emit('update:concept', ancestor)">
        <concept
          :concept="ancestor"
          class="clickable" />
      </li>
    </ul>

    <div v-if="selected">
      <concept :concept="selected" />
      <div>
        <small>
          URI: <a :href="selected.uri">{{ selected.uri }}</a><br>
          Labels: {{ Object.entries(selected.prefLabel || {}).map(e => `${e[1]} (${e[0]})`).join(", ") }}
        </small>
      </div>
    </div>

    <div v-if="narrower">
      <ul class="narrower">
        <li
          v-for="child in narrower"
          :key="child.uri"
          @click="$emit('update:concept', child)">
          <concept
            :concept="child"
            class="clickable" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import Concept from "./Concept"

export default {
  components: { Concept },
  props: {
    concept: {
      type: Object,
      required: true,
    },
    registry: {
      type: Object,
      required: true,
    },
  },
  emits: ["update:concept"],
  data() {
    return {
      selected: {},
      ancestors: [],
      narrower: [],
    }
  },
  watch: {
    concept: {
      immediate: true,
      async handler(concept) {
        console.log(concept.uri)

        // load and merge details into concept
        const details = (await this.registry.getConcepts({ concepts: [concept] }))[0]
        this.selected = Object.assign(concept, details || {})

        this.ancestors = []
        this.ancestors = await this.registry.getAncestors({ concept })
        this.narrower = []
        this.narrower = await this.registry.getNarrower({ concept })
      },
    },
  },
}
</script>

<style scoped>
ul.narrower {
  padding-top: 1em;
}
ul.narrower, ul.ancestors {
  list-style: none;
  padding-left: 0.5em;
}
ul.narrower li:before {
  content: "\21B3\A0";
}
.clickable:hover {
  text-decoration: underline;
  cursor: pointer;
}
ul.ancestors li:before {
  content: "\21B0\A0";
}
</style>
