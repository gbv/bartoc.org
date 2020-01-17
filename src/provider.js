/**
 * Provide access via JSKOS API.
 * This should be replaced by cocoda-sdk, see <https://github.com/gbv/cocoda/issues/522>.
 */

const axios = require('axios')

class Provider {
  constructor (registry = {}, options = {}) {
    this.http = options.http || axios
    this.registry = {
      schemes: 'http://api.dante.gbv.de/voc',
      data: 'http://api.dante.gbv.de/data'
    }
  }

  async get (url, options) {
    return this.http.get(url, options)
  }

  async getSchemes (params = {}) {
    return this.get(this.registry.schemes, { params })
      .then(({ data, headers }) => {
        // FIXME: DANTE API returns wrong X-Total-Count and filtering changes result anyway
        data.totalCount = parseInt(headers['x-total-count'])
        return data
      })
      .then(data => data.filter(voc => {
        // filter by type (TODO: do this in the backend)
        return !params.type || voc.type.includes(params.type)
      }))
      .then(data => data.map(extendScheme))// .filter(voc => isBartocUri(voc.uri)))
      // TODO: catch errors
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
