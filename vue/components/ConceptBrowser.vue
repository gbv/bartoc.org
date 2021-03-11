<template>
  <div v-if="registry">
    <hr>
    <div v-if="selected">
      <h4>Browse vocabulary</h4>
      <concept-details
        v-model:concept="selected"
        :registry="registry" />
    </div>
    <div v-else-if="topConcepts.length">
      <h4>Top concepts</h4>
      <ul class="narrower">
        <li
          v-for="concept in topConcepts"
          :key="concept.uri"
          @click="selected = concept">
          <concept
            :concept="concept"
            class="clickable" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import Concept from "./Concept"
import ConceptDetails from "./ConceptDetails"
import { registryForScheme } from "../utils.js"

export default {
  components: { Concept, ConceptDetails },
  props: {
    scheme: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      registry: null,
      externalSchemeUri: null,
      topConcepts: [],
      selected: null,
    }
  },
  async mounted() {
    const { scheme } = this

    // TODO: allow to switch API endpoints
    this.registry = registryForScheme(scheme)

    // this requires the vocabulary to have top concepts!
    // FIXME for other vocabularies, e.g. query for an example concept
    const possibleUris = [ scheme.uri, ...(scheme.identifier||[]) ]
    for (let uri of possibleUris) {
      var result = await this.registry.getTop({ scheme: { ...scheme, uri } })
      if (result.length) {
        this.topConcepts = result
        this.externalSchemeUri = uri
        break
      }
    }
  },
}
</script>

<style scoped>
ul.narrower {
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
</style>
