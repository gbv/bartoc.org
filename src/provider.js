/**
 * Provide access via JSKOS API.
 * This should be replaced by cocoda-sdk, see <https://github.com/gbv/cocoda/issues/522>.
 */

const axios = require('axios')

class Provider {
  constructor(registry = {}, options = {}) {
    this.http = options.http || axios
    this.registry = {
      schemes: "http://api.dante.gbv.de/voc"
    }
  }

  async get(url, options) {
    return this.http.get(url, options)
  }

  async getSchemes(params = {}) {
    return this.get(this.registry.schemes, { params })
      .then(({data, headers}) => {
        // FIXME: DANTE API returns wrong X-Total-Count and filtering changes result anyway
        data.totalCount = parseInt(headers["x-total-count"])
        return data
      })
      .then(data => data.map(extendScheme).filter(voc => isBartocUri(voc.uri)))
      // TODO: catch errors
  }
}

const bartocUri = new RegExp("^http://bartoc.org/en/node/[1-9][0-9]+$")
const isBartocUri = id => id.match(bartocUri)

function extendScheme(voc) {
  var { uri, identifier } = voc
  if (identifier && !uri.match(bartocUri)) {
    const bartoc = identifier.find(isBartocUri)
    if (bartoc) {
      identifier = identifier.filter(id => !isBartocUri(id))
      identifier.unshift(uri)
      voc.uri = bartoc
    }
  }
  return voc
}

module.exports = config => new Provider(config)
