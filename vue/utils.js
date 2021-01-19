import cdk from "cocoda-sdk"

// TODO: configure somewhere else, this is part of BARTOC data anyway
export const indexingSchemes = [
  {
    uri: "http://bartoc.org/en/node/241",
    namespace: "http://dewey.info/class/",
    notation: ["DDC"],
    API: "/api/",
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
    API: "https://bartoc-skosmos.unibas.ch/rest/v1/",
  },
  {
    uri: "https://bartoc.org/ILC/1",
    identifier: ["http://bartoc.org/de/node/472"],
    namespace: "http://bartoc.org/en/ILC/",
    notation: ["ILC"],
    VOCID: "ILC",
    API: "https://bartoc-skosmos.unibas.ch/rest/v1/",
  },
]

// TODO: use cdk instead
export function loadConcepts(api, uri) {
  if (uri) api = `${api}?uri=${encodeURIComponent(uri)}`
  return fetch(api).then(res => res ? res.json() : [])
}

export function initializeRegistryForScheme(scheme) {
  return cdk.initializeRegistry({
    provider: scheme.API.includes("skosmos") ? "SkosmosApi" : "ConceptApi",
    api: scheme.API,
    schemes: [scheme],
  })
}

// TODO: These methods have to be merged. Also determining how to initialize the registry should be its own utility method.
export async function cdkLoadConcepts(scheme, uri) {
  if (!scheme || !scheme.API || !uri) {
    return []
  }
  const registry = initializeRegistryForScheme(scheme)
  const result = await registry.getConcepts({ concepts: [{ uri, inScheme: [scheme] }] })
  return result
}
