import { cdk, addAllProviders } from "cocoda-sdk"
import { franc } from "franc-min"
import convert3To1 from "iso-639-3-to-1"
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
  item.type = trimStringArray(item.type)

  // arrays of objects with url/uri
  if (Array.isArray(item.license)) {
    item.license = item.license
      .map(l => ({ ...l, uri: trimString(l.uri) }))
      .filter(l => l.uri)
  }

  if (Array.isArray(item.FORMAT)) {
    item.FORMAT = item.FORMAT
      .map(f => ({ ...f, uri: trimString(f.uri) }))
      .filter(f => f.uri)
  }

  if (Array.isArray(item.ACCESS)) {
    item.ACCESS = item.ACCESS
      .map(a => ({ ...a, uri: trimString(a.uri) }))
      .filter(a => a.uri)
  }

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

/**
 * Detect language from string with fallback to code `und`.
 * Returns ISO-639-1 code if avaialble, ISO-639-2 otherwise.
 */
export function guessLanguage(text, minLength=20) {
  const code3 = franc(text || "", { minLength })
  return convert3To1(code3) || code3
}

/**
 * Create a provider for concept selection from API endpoints.
 * It loads top concepts, selected concepts, search results,
 * and narrower concepts for one scheme.
 */
export function createConceptApiProvider({
  schemeUri,
  topUrl,
  conceptsUrl,
  suggestUrl,
  narrowerUrl,
  toModel = (items) => items,
}) {
  return {
    // Load the top concepts of the scheme.
    async loadTop() {
      const url = new URL(topUrl, window.location.origin)
      url.searchParams.set("uri", schemeUri)

      const res = await fetch(url)
      if (!res.ok) {
        return []
      }

      return await res.json()
    },

    // Load the full concept objects for the current model value.
    async loadSelected(modelValue) {
      const uris = (modelValue || [])
        .map(item => item?.uri)
        .filter(Boolean)

      if (!uris.length) {
        return []
      }

      const url = new URL(conceptsUrl, window.location.origin)
      url.searchParams.set("uri", uris.join("|"))
      url.searchParams.set("voc", schemeUri)

      const res = await fetch(url)
      if (!res.ok) {
        return []
      }

      return await res.json()
    },

    // Search concepts for the autocomplete field.
    async search(search) {
      const query = (search || "").trim()
      if (!query) {
        return ["", [], [], []]
      }

      const url = new URL(suggestUrl, window.location.origin)
      url.searchParams.set("search", query)
      url.searchParams.set("voc", schemeUri)

      const res = await fetch(url)
      if (!res.ok) {
        return [query, [], [], []]
      }

      const concepts = await res.json()

      // Return data in the format expected by item-select.
      return [
        query,
        concepts.map(c => c.prefLabel?.en || c.notation?.[0] || c.uri || ""),
        concepts.map(() => ""),
        concepts.map(c => c.uri),
      ]
    },

    // Load narrower concepts for one tree node.
    async loadNarrower(concept) {
      if (!concept?.uri || !narrowerUrl) {
        return
      }

      // Do not load again if narrower concepts are already there.
      if (
        concept.narrower &&
        !concept.narrower.includes(null) &&
        concept.narrower.length
      ) {
        return
      }

      const url = new URL(narrowerUrl, window.location.origin)
      url.searchParams.set("uri", concept.uri)
      url.searchParams.set("voc", schemeUri)

      const res = await fetch(url)
      concept.narrower = res.ok ? await res.json() : []
    },

    // Convert selected concept objects to the wanted model format.
    toModel,
  }
}

// Check if a value is a valid URL.
export function isValidUrl(value) {
  if (!value) {
    return false
  }
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

// validate publisher object with fields `prefLabel.en` and `uri`
export function validatePublisher(publisher = {}) {
  const publisherName = publisher.prefLabel?.en || ""
  const publisherUri = publisher.uri || ""

  const hasPublisherName = publisherName.trim() !== ""
  const hasPublisherUri = publisherUri.trim() !== ""

  if (hasPublisherName && !hasPublisherUri) {
    return { message: "Publisher URI is required." }
  }

  if (!hasPublisherName && hasPublisherUri) {
    return { message: "Publisher name is required." }
  }

  if (hasPublisherUri && !isValidUrl(publisherUri.trim())) {
    return { message: "Publisher URI must be a valid URL." }
  }
}
