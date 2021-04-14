<template>
  <div v-if="registry">
    <p>
      <em>
        Search and browsing in vocabularies registered in BARTOC is experimental.
        See <a href="https://www.npmjs.com/package/cocoda-sdk">cocoda-sdk</a> for technical background.
      </em>
    </p>
    <h4>Search in vocabulary</h4>
    <item-select
      :scheme="accessScheme"
      :extract-value="c => c"
      @change="selected = $event" />
    <div v-if="selected && selected.uri">
      <h4
        v-if="topConcepts.length"
        class="clickable"
        @click="selected = null">
        Top concepts
      </h4>
      <h4 v-else>
        Browse vocabulary
      </h4>
      <concept-details
        v-model:concept="selected"
        :scheme="accessScheme"
        :registry="registry" />
    </div>
    <div v-else-if="topConcepts.length">
      <h4>Top concepts</h4>
      <ul class="narrower">
        <li
          v-for="concept in topConcepts"
          :key="concept.uri"
          @click="selected = concept">
          <icon icon="levelDown" />
          <concept
            :concept="concept"
            class="clickable" />
        </li>
      </ul>
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
          :scheme="scheme"
          :endpoint="endpoint" />
      </li>
    </ul>
  </div>
</template>

<script>
import Concept from "./Concept"
import ConceptDetails from "./ConceptDetails"
import Icon from "./Icon"
import ItemSelect from "./ItemSelect"
import ServiceLink from "./ServiceLink"
import { registryForScheme } from "../utils.js"
import jskos from "jskos-tools"

export default {
  components: { Concept, ConceptDetails, ServiceLink, ItemSelect, Icon },
  props: {
    scheme: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      registry: null,
      accessScheme: this.scheme,
      topConcepts: [],
      selected: {},
    }
  },
  async mounted() {
    const { scheme } = this

    // FIXME: this requires the vocabulary to have top concepts. Better query example concept instead?
    const possibleUris = [ scheme.uri, ...(scheme.identifier||[]) ]
    for (let uri of possibleUris) {
      const accessScheme = { ...scheme, uri }

      // TODO: allow to manually switch API endpoints
      const registry = registryForScheme(accessScheme)
      if (registry) {
        this.registry = registry

        accessScheme.VOCID = registry._jskos.schemes[0].VOCID // TODO: this is a hack
        this.accessScheme = accessScheme

        var results = []
        try {
          results = await this.registry.getTop({ scheme: this.accessScheme })
        } catch (e) {
          // TODO: catch CDKError
          console.error(e)
        }
        if (results.length) {
          this.topConcepts = jskos.sortConcepts(results)
          break
        } else {
          console.info(`Vocabulary ${uri} has no top concepts!`)
        }
      } else {
        console.debug("Failed to get registry for scheme: ", this.accessScheme)
      }
    }
  },
}
</script>

<style scoped>
h4 {
  padding-top: 0.5em;
}
ul.narrower {
  list-style: none;
  padding-left: 0.5em;
}
.clickable:hover {
  text-decoration: underline;
  cursor: pointer;
}
</style>
