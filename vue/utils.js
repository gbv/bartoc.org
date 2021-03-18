import cdk from "cocoda-sdk"

const registryCache = {}
export function registryForScheme(scheme) {
  if (!scheme || !scheme.API || !scheme.API.length) return

  const { url, type } = scheme.API[0]

  if (!(url in registryCache)) {
    const config = { schemes: [scheme] }
    if (type === "http://bartoc.org/api-type/jskos") {
      // use local database for bartoc.org
      config.api = url.match(/^https?:\/\/bartoc.org\/api\/?/) ? "/api/" : url
      config.provider = "ConceptApi"
    } else if (type === "http://bartoc.org/api-type/skosmos") {
      config.provider = "SkosmosApi"
      const match = url.match(/(.+\/)([^/]+)\/$/)
      if (!match) return
      config.api = match[1] + "rest/v1/"
      scheme.VOCID = match[2]
    }
    if (!config.provider) return

    registryCache[url] = cdk.initializeRegistry(config)
  }

  return registryCache[url]
}

export async function cdkLoadConcepts(scheme, uri) {
  const registry = registryForScheme(scheme)
  if (!registry || !uri) return []

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
    API: [{url:"https://bartoc-skosmos.unibas.ch/EuroVoc/",type:"http://bartoc.org/api-type/skosmos"}],
  },
  {
    uri: "https://bartoc.org/ILC/1",
    identifier: ["http://bartoc.org/de/node/472"],
    namespace: "https://bartoc.org/ILC/1/",
    notation: ["ILC"],
    API: [{url:"https://bartoc-skosmos.unibas.ch/ILC/",type:"http://bartoc.org/api-type/skosmos"}],
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
  if (uri) api = `${api}?uri=${encodeURIComponent(uri)}`
  return fetch(api).then(res => res ? res.json() : [])
}

