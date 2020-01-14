const bartocUri = new RegExp('^http://bartoc.org/en/node/[1-9][0-9]+$')
const isBartocUri = id => id.match(bartocUri)

module.exports = {
  // TODO: move utility function to jskos-tools
  label (labels, language) {
    var value = '???'
    var code = language || 'en'
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

  escapeXML: s => String(s).replace(/[<>&"']/g, c => '&#' + c.charCodeAt(0) + ';'),

  uriLink: uri => isBartocUri(uri)
    ? '/en/node/' + uri.split('/').pop()
    : '/vocabularies?uri=' + escape(uri),

  buildQuery: query => '?' + Object.keys(query)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(query[key])).join('&')
}
