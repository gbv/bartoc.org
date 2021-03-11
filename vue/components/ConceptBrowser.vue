<template>
  <div v-if="registry">
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
    <div v-else>
      <p>
        Access to this vocabulary failed. Vocabulary browsing
        in BARTOC is experimental this this may get fixed soon.
      </p>
    </div>
  </div>
  <div v-else-if="(scheme.API||[]).length">
    <p>
      Access to this repository is possible via APIs
      but inclusion in BARTOC has not been implemented yet:
    </p>
    <ul>
      <li
        v-for="endpoint in scheme.API"
        :key="endpoint.url">
        <service-link
          :vocabulary="scheme"
          :api="endpoint.url"
          :type="endpoint.type" />
      </li>
    </ul>
  </div>
</template>

<script>
import Concept from "./Concept"
import ConceptDetails from "./ConceptDetails"
import ServiceLink from "./ServiceLink"
import { registryForScheme } from "../utils.js"

export default {
  components: { Concept, ConceptDetails, ServiceLink },
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

    // TODO: allow to manually switch API endpoints
    this.registry = registryForScheme(scheme)

    // this requires the vocabulary to have top concepts!
    // FIXME for other vocabularies, e.g. query for an example concept
    const possibleUris = [ scheme.uri, ...(scheme.identifier||[]) ]
    for (let uri of possibleUris) {
      // TODO: catch CDKError
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
