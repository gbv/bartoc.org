import { validatePublisher } from "../utils.js"
import { normalizeUri } from "../../src/uri.js"
import { hasMeaningfulValue, hasValidVersionOf } from "../../src/versioning.js"

export { hasMeaningfulValue, hasValidVersionOf }

export const CONCEPT_SCHEME_TYPE = "http://www.w3.org/2004/02/skos/core#ConceptScheme"

const objectFields = ["prefLabel", "altLabel", "definition", "ADDRESS", "DISPLAY"]
const arrayFields = [
  "notation",
  "identifier",
  "languages",
  "license",
  "type",
  "subject",
  "subjectOf",
  "partOf",
  "FORMAT",
  "API",
  "ACCESS",
  "publisher",
  "versionOf",
  "basedOn",
]

export function normalizeEditableItem(current = {}) {
  const item = current || {}

  objectFields.forEach((key) => {
    if (!item[key]) {
      item[key] = {}
    }
  })

  arrayFields.forEach((key) => {
    if (!item[key]) {
      item[key] = []
    }
  })

  return item
}

export function parseNotationExamples(value = "") {
  return value
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value !== "")
}

export function conceptPickerModel(items = []) {
  return items
    .filter(item => item?.uri)
    .map(({ uri }) => ({ uri }))
}

export function githubIssueUrl(title, body) {
  return (
    "https://github.com/gbv/bartoc.org/issues/new" +
    "?title=" +
    encodeURIComponent(title) +
    "&body=" +
    encodeURIComponent(body)
  )
}

export function itemError(item) {
  if (!Object.keys(item.prefLabel).length) {
    return { message: "item must have at least a title!" }
  }

  if (hasSelfReference(item, "versionOf")) {
    return { message: "A vocabulary cannot be a version of itself." }
  }

  if (hasSelfReference(item, "basedOn")) {
    return { message: "A vocabulary cannot be based on itself." }
  }

  const hasEnglishAbstract = item.definition?.en?.some(text => text?.trim())

  if (!hasEnglishAbstract && !hasValidVersionOf(item)) {
    return { message: "Please provide at least one English abstract." }
  }

  if (item.publisher?.length) {
    const publisherError = validatePublisher(item.publisher[0])
    if (publisherError) {
      return publisherError
    }
  }
}

function hasSelfReference(item, field) {
  const uri = normalizeUri(item?.uri)
  return Boolean(
    uri &&
    Array.isArray(item?.[field]) &&
    item[field].some(reference => normalizeUri(reference?.uri) === uri),
  )
}

export function cleanupItem(item) {
  // Vocabulary record should always be a ConceptScheme.
  if (item.type[0] !== CONCEPT_SCHEME_TYPE) {
    item.type.unshift(CONCEPT_SCHEME_TYPE)
  }
  // Remove empty fields recursively.
  item = filtered(item)
  // If there are API endpoints, keep only those that have a URL.
  if (item.API) {
    item.API = item.API.filter((endpoint) => endpoint.url)
  }
  // Normalize subjects: keep only the fields needed by the backend.
  if (item.subject) {
    item.subject = item.subject.map(({ uri, inScheme, notation }) => {
      inScheme = inScheme.map(({ uri }) => ({ uri }))
      return { uri, inScheme, notation }
    })
  }
  if (item.definition && typeof item.definition === "object") {
    delete item.definition[""]
  }

  // VersionOf
  if (item.versionOf) {
    item.versionOf = item.versionOf
      .map(({ uri }) => ({ uri }))
      .filter(value => value.uri)
  }

  // BasedOn
  if (item.basedOn) {
    item.basedOn = item.basedOn
      .map(({ uri }) => ({ uri }))
      .filter(value => value.uri)
  }

  return item
}

function filtered(value, parentKey = null) {
  if (value && typeof value === "object") {
    if (Array.isArray(value)) {
      value = value.map((value) => filtered(value, parentKey)).filter(Boolean)
      return value.length ? value : null
    } else {
      let keys =
        "uri" in value && !value.uri
          ? []
          : Object.keys(value).filter((key) => key[0] !== "_")

      // Keep insertion order for definition language keys.
      if (parentKey !== "definition") {
        keys.sort()
      }

      const obj = keys.reduce((obj, key) => {
        const fieldValue = filtered(value[key], key)
        if (fieldValue) {
          obj[key] = fieldValue
        }
        return obj
      }, {})

      return Object.keys(obj).length ? obj : null
    }
  } else {
    return value
  }
}
