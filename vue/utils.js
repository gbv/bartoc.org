import cdk from "cocoda-sdk"

// Initialize a CDK Registry object (if possible)
function registryFromEndpoint({url, type}) {
  console.log(url,type)
  if (type === "http://bartoc.org/api-type/jskos") {
    return cdk.initializeRegistry({
      provider: "ConceptApi",
      api: url,
      schemes: [],
    })
  } else if (type === "http://bartoc.org/api-type/skosmos") {
    const api = url.replace(/[^/]+\/$/,"rest/v1/")
    return cdk.initializeRegistry({
      provider: "SkosmosApi",
      api,
      schemes: [], // TODO: add VOCID (is part of the URL but we need scheme URI)
    })
  }
}

// Use a cache to minimize number of registry initializations
const registryCache = {}
export function initializeRegistry(endpoint) {
  if ((endpoint||{}).url) {
    if (!registryCache[endpoint.url]) {
      registryCache[endpoint.url] = registryFromEndpoint(endpoint)
    }
    return registryCache[endpoint.url]
  }
}

export async function cdkLoadConcepts(scheme, uri) {
  const registry = (scheme||{}).API ? initializeRegistry(scheme.API[0]) : null
  if (!registry || !uri) return []

  const result = await registry.getConcepts({ concepts: [{ uri, inScheme: [scheme] }] })
  return result
}

// TODO: configure somewhere else, this is part of BARTOC data anyway
export const indexingSchemes = [
  {
    uri: "http://bartoc.org/en/node/241",
    namespace: "http://dewey.info/class/",
    notation: ["DDC"],
    API: [{url:"/api/",type:"http://bartoc.org/api-type/jskos"}],
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
    API: [{url:"https://bartoc-skosmos.unibas.ch/rest/v1/",type:"http://bartoc.org/api-type/skosmos"}],
  },
  {
    uri: "https://bartoc.org/ILC/1",
    identifier: ["http://bartoc.org/de/node/472"],
    namespace: "https://bartoc.org/ILC/1/",
    notation: ["ILC"],
    VOCID: "ILC",
    API: [{url:"https://bartoc-skosmos.unibas.ch/rest/v1/",type:"http://bartoc.org/api-type/skosmos"}],
  },
]

// TODO: use cdk instead
export function loadConcepts(api, uri) {
  if (uri) api = `${api}?uri=${encodeURIComponent(uri)}`
  return fetch(api).then(res => res ? res.json() : [])
}

