import { readFileSync } from "fs"
import config from "../config/index.js"
import { join } from "path"
import { isBartocUri } from "./uri.js"


const readLines = (baseDir, file) => readFileSync(join(baseDir, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)

const htmlUnsafeCharacters = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
}

export function serializeJsonForHtml(value) {
  return JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    character => htmlUnsafeCharacters[character],
  )
}

export default {
  cleanupItem: item => {
    for (const key in item) {
      if (key[0] === "_") {
        delete item[key]
      }
    }
    return item
  },

  readJson: (baseDir, file) =>
    JSON.parse(readFileSync(join(baseDir, file), "utf8")),

  readNdjson: (baseDir, file) =>
    readLines(baseDir, file).map(line => JSON.parse(line)),

  serializeJsonForHtml,

  escapeXML: s => String(s).replace(/[<>&"']/g, c => "&#" + c.charCodeAt(0) + ";"),

  indexByUri: array => array.reduce((obj, item) => {
    obj[item.uri] = item; return obj
  }, {}),

  // TODO: move utility function to jskos-tools
  label (labels, language, fallback = "") {
    let value = fallback, code = language || "en"
    labels = labels || {}
    if (code in labels) {
      value = labels[code]
    } else {
      for (code in labels) {
        value = labels[code]
        break
      }
    }
    return { value, code }
  },

  isBartocUri,

  uriLink: uri => isBartocUri(uri)
    ? "/en/node/" + uri.split("/").pop()
    : "/vocabularies?uri=" + escape(uri),

  // Build an absolute backend URL based on config.backend.api.
  backendUrl: path => {
    const base = config.backend.api.endsWith("/")
      ? config.backend.api
      : `${config.backend.api}/`

    return new URL(path, base)
  },

}

// structuredClone omitting functions, optionally normalizing and removing interal keys
export function clone (value, { normalize, removeUnderscore } = {}) {
  if (typeof value === "string") {
    // apply Unicode normalization to strings
    return normalize ? value.normalize() : value
  } else if (Array.isArray(value)) {
    return value.map(v => clone(v, { normalize, removeUnderscore }))
  } else if (typeof value === "object" && value !== null) {
    let keys = Object.keys(value)
    // sort keys and remove keys starting with "_"
    if (removeUnderscore) {
      keys = keys.filter(key => key[0] !== "_")
    }
    if (normalize) {
      keys = keys.sort()
    }
    return keys.reduce((obj, key) => {
      obj[key] = clone(value[key], { normalize, removeUnderscore })
      return obj
    }, {})
  } else {
    return value
  }
}
