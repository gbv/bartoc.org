<template>
  <div class="concept-details">
    <ul class="ancestors">
      <li
        v-for="ancestor in ancestors.filter(Boolean).reverse()"
        :key="ancestor.uri"
        @click="$emit('update:concept', ancestor)">
        <icon name="levelUp" />
        <item-name
          :item="ancestor"
          :notation="!display.hideNotation"
          class="clickable" />
      </li>
    </ul>
    <div v-if="selected">
      <div style="font-size:large">
        <item-name
          :item="selected"
          :notation="!display.hideNotation" />
        <a
          v-if="k10plus"
          :href="k10plus"
          title="search in K10plus library catalog"
          style="padding-left: 0.5em"
          target="k10plus">📚</a>
      </div>
      <div v-if="selected.uri || (selected.identifier||[]).length">
        <ul
          class="list-inline"
          style="margin-bottom: 0.2em">
          <li
            v-if="selected.uri"
            class="list-inline-item">
            <icon name="link" />
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
            name="created"
            padding="" />
          {{ selected.created }}
        </li>
        <li
          v-if="selected.issued"
          class="list-inline-item"
          title="issued">
          <icon
            name="modified"
            padding="" />
          {{ selected.issued }}
        </li>
        <li
          v-if="selected.modified"
          class="list-inline-item"
          title="modified">
          <icon
            name="modified"
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
          <icon name="levelDown" />
          <item-name
            :item="child"
            :notation="!display.hideNotation"
            class="clickable" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import Icon from "./Icon"
import ItemLabels from "./ItemLabels"
import ItemName from "./ItemName"
import ItemNotes from "./ItemNotes"
import { sortConcepts } from "../utils.js"
import k10plusikt from "../../data/k10plus-ikt.json"

export default {
  components: { ItemName, ItemNotes, ItemLabels, Icon },
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
      default() {
        return {} 
      },
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
  computed: {
    k10plus() {
      const { scheme, selected } = this
      if (!selected || !selected.notation) {
        return
      }
      const ikt = k10plusikt[(scheme.CQLKEY || "").toUpperCase()]
      const notation = selected.notation || []
      return ikt ? `https://opac.k10plus.de/DB=2.299/CMD?ACT=SRCHA&IKT=${ikt}&TRM=${notation[0]}` : null
    },
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
