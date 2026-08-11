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

<script setup>
import { computed, onMounted, ref, watch } from "vue"
import ConceptDetails from "./ConceptDetails.vue"
import Icon from "./Icon.vue"
import ItemName from "./ItemName.vue"
import ItemSelect from "./ItemSelect.vue"
import ServiceLink from "./ServiceLink.vue"
import { registryForScheme, sortConcepts } from "../utils.js"

const props = defineProps({
  scheme: {
    type: Object,
    required: true,
  },
})

const registry = ref(null)
const accessScheme = ref(props.scheme)
const topConcepts = ref([])
const selected = ref({})
const display = computed(() => props.scheme.DISPLAY || {})

// Let the parent page reset the selected concept when leaving the Content tab.
function selectConcept(concept) {
  selected.value = concept
}

defineExpose({ selectConcept })

watch(selected, concept => {
  // Update URL with new selected concept
  const hash = window.location.hash
  const urlParams = new URLSearchParams(window.location.search)
  if (concept && concept.uri) {
    urlParams.set("uri", concept.uri)
  } else {
    urlParams.delete("uri")
  }
  // Build new URL
  let url = `${window.location.href.replace(hash, "").replace(window.location.search, "")}`
  if (urlParams.toString()) {
    url += `?${urlParams.toString()}`
  }
  // Note that hash/fragment needs to be at the end of the URL, otherwise the search params will be considered part of the hash!
  url += hash
  window.history.replaceState({}, "", url)
})

onMounted(async () => {
  const { scheme } = props

  // Get URI for selected concept from URL
  const urlParams = new URLSearchParams(window.location.search)
  const selectedUri = urlParams.get("uri")

  // FIXME: this requires the vocabulary to have top concepts. Better query example concept instead?
  const possibleUris = [ scheme.uri, ...(scheme.identifier||[]) ]
  for (let uri of possibleUris) {
    const schemeWithUri = { ...scheme, uri }

    // TODO: allow to manually switch API endpoints
    const registryCandidate = registryForScheme(schemeWithUri)
    if (registryCandidate) {
      registry.value = registryCandidate

      schemeWithUri.VOCID = registryCandidate._jskos.schemes && registryCandidate._jskos.schemes.length ? registryCandidate._jskos.schemes[0].VOCID : undefined // TODO: this is a hack
      accessScheme.value = schemeWithUri

      let results = []
      try {
        results = await registry.value.getTop({ scheme: accessScheme.value })
      } catch (e) {
        // TODO: catch CDKError
        console.error(e)
      }
      if (results.length) {
        sortConcepts(results, props.scheme)
        topConcepts.value = [...results] // no clue why this is necessary (WTF?)
        // Load selected concept if necessary
        if (selectedUri) {
          // ConceptDetails will load the details itself
          selected.value = {
            uri: selectedUri,
            inScheme: [schemeWithUri],
          }
        }
        break
      } else {
        console.info(`Vocabulary ${uri} has no top concepts!`)
      }
    } else {
      console.debug("Failed to get registry for scheme: ", accessScheme.value)
    }
  }
})
</script>

<style scoped>
h4 {
  padding-top: var(--cc-row-padding-x);
}
ul.narrower {
  list-style: none;
  padding-left: var(--cc-space-sm);
}
.clickable:hover {
  text-decoration: underline;
  cursor: pointer;
}
</style>
