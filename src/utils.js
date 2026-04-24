import { readFileSync } from "fs"
import config from "../config/index.js"
import { join } from "path"


const bartocUri = new RegExp("^http://bartoc.org/en/node/[1-9][0-9]+$")
const isBartocUri = id => id.match(bartocUri)

const readLines = (baseDir, file) => readFileSync(join(baseDir, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)

/* TODO: this is not used yet
function extendScheme (voc) {
  var { uri, identifier } = voc
  if (identifier && !isBartocUri(uri)) {
    const bartoc = identifier.find(isBartocUri)
    if (bartoc) {
      identifier = identifier.filter(id => !isBartocUri(id))
      identifier.unshift(uri)
      voc.uri = bartoc
    }
  }
  return voc
} */

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

