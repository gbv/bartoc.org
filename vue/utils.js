import cdk from "cocoda-sdk"

// Use a store to minimize number of registry initializations
const store = {
  registries: [],
  getRegistry(api) {
    // 1. Try to get registry from cache
    let registry = this.registries.find(r => r._jskos.api === api)
    if (!registry) {
      // 2. If not found, initialize it
      registry = cdk.initializeRegistry({
        provider: api.includes("skosmos") ? "SkosmosApi" : "ConceptApi",
        api,
        // schemes is only necessary for using `getSchemes` which we don't use here.
        schemes: [],
      })
      // 3. Add to cache
      this.registries.push(registry)
    }
    return registry
  },
}

// TODO: configure somewhere else, this is part of BARTOC data anyway
export const indexingSchemes = [
  {
    uri: "http://bartoc.org/en/node/241",
    namespace: "http://dewey.info/class/",
    notation: ["DDC"],
    API: ["/api/"],
  },
  // NOTE: For BARTOC, we need to have those URIs in the `uri` field that the API uses.
  // ? Is this an issue if we use different URIs?
  {
    uri: "http://eurovoc.europa.eu/100141",
    identifier: ["http://bartoc.org/en/node/15"],
    namespace: "http://eurovoc.europa.eu/",
    prefLabel: { en: "EuroVoc" },
    notation: ["EUROVOC"],
    VOCID: "EuroVoc",
    API: ["https://bartoc-skosmos.unibas.ch/rest/v1/"],
  },
  {
    uri: "https://bartoc.org/ILC/1",
    identifier: ["http://bartoc.org/de/node/472"],
    namespace: "http://bartoc.org/en/ILC/",
    notation: ["ILC"],
    VOCID: "ILC",
    API: ["https://bartoc-skosmos.unibas.ch/rest/v1/"],
  },
]

// TODO: use cdk instead
export function loadConcepts(api, uri) {
  if (uri) api = `${api}?uri=${encodeURIComponent(uri)}`
  return fetch(api).then(res => res ? res.json() : [])
}

export function initializeRegistry(api) {
  return store.getRegistry(api)
}

// TODO: These methods have to be merged. Also determining how to initialize the registry should be its own utility method.
export async function cdkLoadConcepts(scheme, uri) {
  if (!scheme || !scheme.API || !scheme.API.length || !uri) {
    return []
  }
  const registry = initializeRegistry(scheme.API[0])
  const result = await registry.getConcepts({ concepts: [{ uri, inScheme: [scheme] }] })
  return result
}
