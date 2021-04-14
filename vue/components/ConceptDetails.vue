<template>
  <div class="concept-details">
    <ul class="ancestors">
      <li
        v-for="ancestor in ancestors"
        :key="ancestor.uri"
        @click="$emit('update:concept', ancestor)">
        <icon icon="levelUp" />
        <concept
          :concept="ancestor"
          :hide-notation="display.hideNotation"
          class="clickable" />
      </li>
    </ul>
    <div v-if="selected">
      <div style="font-size:large">
        <concept
          :concept="selected"
          :hide-notation="display.hideNotation" />
      </div>
      <div v-if="selected.uri || (selected.identifier||[]).length">
        <ul
          class="list-inline"
          style="margin-bottom: 0.2em">
          <li
            v-if="selected.uri"
            class="list-inline-item">
            <icon icon="link" />
            <a :href="selected.uri">{{ selected.uri }}</a>
          </li>
          <li
            v-for="id in (selected.identifier||[])"
            :key="id"
            class="list-inline-item">
            {{ id }}
          </li>
        </ul>
      </div>
      <item-labels :item="selected" />
      <item-notes :item="selected" />
      <ul class="list-inline">
        <li
          v-if="selected.created"
          class="list-inline-item"
          title="created">
          <icon
            icon="created"
            padding="" />
          {{ selected.created }}
        </li>
        <li
          v-if="selected.issued"
          class="list-inline-item"
          title="issued">
          <icon
            icon="modified"
            padding="" />
          {{ selected.issued }}
        </li>
        <li
          v-if="selected.modified"
          class="list-inline-item"
          title="modified">
          <icon
            icon="modified"
            padding="" />
          {{ selected.modified }}
        </li>
      </ul>
    </div>

    <div v-if="narrower">
      <ul class="narrower">
        <li
          v-for="child in narrower"
          :key="child.uri"
          @click="$emit('update:concept', child)">
          <icon :icon="'levelDown'" />
          <concept
            :concept="child"
            :hide-notation="display.hideNotation"
            class="clickable" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import Concept from "./Concept"
import Icon from "./Icon"
import ItemLabels from "./ItemLabels"
import ItemNotes from "./ItemNotes"
import { sortConcepts } from "../utils.js"

export default {
  components: { Concept, ItemNotes, ItemLabels, Icon },
  props: {
    concept: {
      type: Object,
      required: true,
    },
    registry: {
      type: Object,
      required: true,
    },
    scheme: {
      type: Object,
      required: true,
    },
    display: {
      type: Object,
      default() { return {} },
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

        this.selected = concept
        this.ancestors = []
        this.narrower = []

        if (concept && concept.uri) {
          // load and merge details into concept
          const details = (await this.registry.getConcepts({ concepts: [concept] }))[0]
          this.selected = Object.assign(concept, details || {})

          // inject access scheme. Required to get VOCID. Should better be fixed in cocoda-sdk?
          concept.inScheme = [this.scheme]

          this.ancestors = await this.registry.getAncestors({ concept })
          this.narrower = sortConcepts(await this.registry.getNarrower({ concept }), this.scheme)
        }
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
.clickable:hover {
  text-decoration: underline;
  cursor: pointer;
}
</style>
