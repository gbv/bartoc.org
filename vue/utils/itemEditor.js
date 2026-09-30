import {
  mediaThumbnailUrl,
  withMediaThumbnail,
} from "../utils.js"
import {
  CONCEPT_SCHEME_TYPE,
  hasMeaningfulValue,
  hasValidVersionOf,
  kosTypeUris,
  versionNumber,
} from "../../src/editions.js"
import { validateItem } from "../../src/validation.js"

export {
  CONCEPT_SCHEME_TYPE,
  hasMeaningfulValue,
  hasValidVersionOf,
  kosTypeUris,
}

const objectFields = [
  "ADDRESS",
  "DISPLAY",
  "altLabel",
  "definition",
  "prefLabel",
]

const arrayFields = [
  "ACCESS",
  "API",
  "FORMAT",
  "basedOn",
  "identifier",
  "issueTracker",
  "languages",
  "license",
  "media",
  "notation",
  "partOf",
  "publisher",
  "subject",
  "subjectOf",
  "type",
  "versionOf",
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

  // Convert the old issue example to the current JSKOS media shape.
  item.media = item.media.map(media => withMediaThumbnail(
    media,
    mediaThumbnailUrl(media),
  ))

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
  const error = validateItem(item)[0]
  return error ? { message: error.message } : undefined
}


export function cleanupItem(item) {
  // Vocabulary record should always be a ConceptScheme.
  if (item.type[0] !== CONCEPT_SCHEME_TYPE) {
    item.type.unshift(CONCEPT_SCHEME_TYPE)
  }
  if ("version" in item) {
    item.version = versionNumber(item)
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
