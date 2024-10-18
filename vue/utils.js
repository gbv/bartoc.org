import { cdk, addAllProviders } from "cocoda-sdk"
addAllProviders()
import jskos from "jskos-tools"

export function registryForScheme() {
  return cdk.registryForScheme(...arguments)
}

export async function cdkLoadConcepts(scheme, uri) {
  const registry = registryForScheme(scheme)
  if (!registry || !uri) {
    return []
  }

  const result = await registry.getConcepts({ concepts: [{ uri, inScheme: [scheme] }] })
  return result
}

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
    API: [{url:"https://skosmos.bartoc.org/15/",type:"http://bartoc.org/api-type/skosmos"}],
  },
  {
    uri: "http://www.iskoi.org/ilc/2/scheme",
    identifier: ["http://bartoc.org/de/node/472"],
    namespace: "http://www.iskoi.org/ilc/2/class/",
    notation: ["ILC"],
    API: [{url:"https://skosmos.bartoc.org/472/",type:"http://bartoc.org/api-type/skosmos"}],
  },
]

export const apiTypesScheme = {
  uri: "http://bartoc.org/en/node/20002",
  API:[
    {
      url: "/api/",
      type: "http://bartoc.org/api-type/jskos",
    },
  ],
}

// TODO: use cdk instead
export function loadConcepts(api, uri) {
  if (uri) {
    api = `${api}?uri=${encodeURIComponent(uri)}`
  }
  return fetch(api).then(res => res ? res.json() : [])
}

export function sortConcepts(set, scheme) {
  const numericalNotation = !!(scheme.DISPLAY && scheme.DISPLAY.numericalNotation)
  return jskos.sortConcepts(set, numericalNotation)
}
