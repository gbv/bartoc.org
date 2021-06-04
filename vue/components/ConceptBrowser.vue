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
        :display="display"
        :registry="registry" />
    </div>
    <div v-else-if="topConcepts.length">
      <h4>Top concepts</h4>
      <ul class="narrower">
        <li
          v-for="concept in topConcepts"
          :key="concept.uri"
          @click="selected = concept">
          <icon name="levelDown" />
          <item-name
            :item="concept"
            :notation="!display.hideNotation"
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
import ConceptDetails from "./ConceptDetails"
import Icon from "./Icon"
import ItemName from "./ItemName"
import ItemSelect from "./ItemSelect"
import ServiceLink from "./ServiceLink"
import { registryForScheme, sortConcepts } from "../utils.js"

export default {
  components: { ConceptDetails, ServiceLink, ItemName, ItemSelect, Icon },
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
  computed: {
    display() {
      return this.scheme.DISPLAY || {}
    },
  },
  watch: {
    selected(concept) {
      if (concept && concept.uri) {
        // Update URL with new selected concept
        const hash = window.location.hash
        const urlParams = new URLSearchParams(window.location.search)
        urlParams.set("uri", concept.uri)
        // Note that hash/fragment needs to be at the end of the URL, otherwise the search params will be considered part of the hash!
        window.history.replaceState({}, "", `${window.location.href.replace(hash, "").replace(window.location.search, "")}?${urlParams.toString()}${hash}`)
      }
    },
  },
  async mounted() {
    const { scheme } = this

    // Get URI for selected concept from URL
    const urlParams = new URLSearchParams(window.location.search)
    const selectedUri = urlParams.get("uri")

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
          sortConcepts(results, this.scheme)
          this.topConcepts = [...results] // no clue why this is necessary (WTF?)
          // Load selected concept if necessary
          if (selectedUri) {
            const selected = (await this.registry.getConcepts({ concepts: [{ uri: selectedUri }] }))[0]
            if (selected) {
              this.selected = selected
            }
          }
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
