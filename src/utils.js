const bartocUri = new RegExp("^http://bartoc.org/en/node/[1-9][0-9]+$")
const isBartocUri = id => id.match(bartocUri)

const queryString = query => Object.keys(query).map(key => key + '=' + params[key]).join('&')

const uriLink = uri => isBartocUri(uri, query)
               ? "/en/node/" + uri.split("/").pop()
               : "/vocabularies?uri=" + escape(uri)

module.exports = {
  // TODO: move utility function to jskos-tools
  label(labels, language) {
    var value = "???"
    var code = language || "en"
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

  escapeXML(s) {
    return String(s).replace(/[<>&"']/g, c => "&#" + c.charCodeAt(0) + ";")
  },

  isBartocUri,

  uriLink
}
