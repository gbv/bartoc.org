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


// Trim strings in item identifiers
function trimString(value) {
  return typeof value === "string" ? value.trim() : value
}

// Trim arrays of strings in item identifiers
function trimStringArray(value) {
  if (!Array.isArray(value)) {
    return value
  }
  return value
    .map(v => trimString(v))
    .filter(v => !(typeof v === "string" && v === ""))
}

// Trim all relevant string fields in an item identifier object
export function trimItemIdentifiers(item) {
  if (!item || typeof item !== "object") {
    return item
  }

  // single string fields
  item.url = trimString(item.url)
  item.namespace = trimString(item.namespace)
  item.uriPattern = trimString(item.uriPattern)
  item.notationPattern = trimString(item.notationPattern)
  item.CONTACT = trimString(item.CONTACT)
  item.MARCSPEC = trimString(item.MARCSPEC)
  item.PICAPATH = trimString(item.PICAPATH)
  item.CQLKEY = trimString(item.CQLKEY)
  item.startDate = trimString(item.startDate)
  item.extent = trimString(item.extent)

  // arrays of strings
  item.identifier = trimStringArray(item.identifier)
  item.languages = trimStringArray(item.languages)
  item.notation = trimStringArray(item.notation)
  item.license = trimStringArray(item.license)
  item.type = trimStringArray(item.type)
  item.FORMAT = trimStringArray(item.FORMAT)
  item.ACCESS = trimStringArray(item.ACCESS)

  // arrays of objects with url/uri
  if (Array.isArray(item.subjectOf)) {
    item.subjectOf = item.subjectOf
      .map(s => ({ ...s, url: trimString(s.url) }))
      .filter(s => s.url)
  }

  if (Array.isArray(item.partOf)) {
    item.partOf = item.partOf
      .map(p => ({ ...p, uri: trimString(p.uri) }))
      .filter(p => p.uri)
  }

  if (Array.isArray(item.publisher)) {
    item.publisher = item.publisher.map(p => ({ ...p, uri: trimString(p.uri) }))
  }

  if (Array.isArray(item.API)) {
    item.API = item.API
      .map(ep => ({ ...ep, url: trimString(ep.url), type: trimString(ep.type) }))
      .filter(ep => ep.url)
  }

  // subjects: uri + scheme uri + notation
  if (Array.isArray(item.subject)) {
    item.subject = item.subject
      .map(s => ({
        ...s,
        uri: trimString(s.uri),
        notation: trimStringArray(s.notation),
        inScheme: Array.isArray(s.inScheme)
          ? s.inScheme.map(sc => ({ ...sc, uri: trimString(sc.uri) })).filter(sc => sc.uri)
          : s.inScheme,
      }))
      .filter(s => s.uri)
  }

  return item
}

