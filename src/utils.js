const { readFileSync } = require('fs')
const bartocUri = new RegExp('^http://bartoc.org/en/node/[1-9][0-9]+$')
const isBartocUri = id => id.match(bartocUri)

const readLines = file => readFileSync(file).toString()
  .split(/\n|\n\r/).filter(Boolean)

module.exports = {

  readNdjson: file => readLines(file).map(JSON.parse),

  readCsv: file => readLines(file).map(row => row.split(',')),

  escapeXML: s => String(s).replace(/[<>&"']/g, c => '&#' + c.charCodeAt(0) + ';'),

  indexByUri: array => array.reduce( (obj, item) => { obj[item.uri] = item; return obj }, {}),

  buildQuery: query => '?' + Object.keys(query)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(query[key])).join('&'),

  // TODO: move utility function to jskos-tools
  label (labels, language, fallback='') {
    var value = fallback
    var code = language || 'en'
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
    ? '/en/node/' + uri.split('/').pop()
    : '/vocabularies?uri=' + escape(uri)

}
