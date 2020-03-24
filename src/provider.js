/**
 * Provide access via JSKOS API.
 * This should be replaced by cocoda-sdk, see <https://github.com/gbv/cocoda/issues/522>.
 */

const axios = require('axios')

class Provider {
  constructor (registry = {}, options = {}) {
    this.http = options.http || axios
    this.registry = {
      data: 'http://api.dante.gbv.de/data'
    }
  }

  async get (url, options) {
    return this.http.get(url, options)
  }

  async getConcept (params = {}) {
    return this.get(this.registry.data, { params })
      .then(({ data, headers }) => data[0])
  }
}

const { isBartocUri } = require('./utils')

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
}

module.exports = config => new Provider(config)
