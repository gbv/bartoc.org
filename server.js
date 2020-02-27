const config = require('./config')
const page = require('./routes/page')
const provider = require('./src/provider')()
const utils = require('./src/utils')
const jsonld = require('jsonld')
const path = require('path')

// static data
const registries = utils.indexByUri(utils.readNdjson('./data/registries.ndjson'))
const nkostypes = utils.indexByUri(utils.readNdjson('./cache/nkostype.ndjson'))

const cachedVocs = utils.indexByUri(utils.readNdjson('./cache/vocabularies.ndjson'))


config.log(`Running in ${config.env} mode.`)

const repoType = 'http://bartoc.org/full-repository'
const repositories = utils.indexByUri(Object.values(registries).filter(item => item.type.find(type => type === repoType)))
config.log(`Read ${Object.keys(registries).length} registries, ${Object.keys(repositories).length} also being repositories or services.`)

// Initialize express with settings
const express = require('express')
const app = express()
app.set('json spaces', 2)

// Configure view engine to render EJS templates.
app.set('views', path.join(__dirname, '/views'))
app.set('view engine', 'ejs')

// static assets
app.use(express.static('static'))

// redirect permanently moved URLs from legacy BARTOC.org
for (const [from, to] of Object.entries(config.redirects)) {
  app.get(from, (req, res) => res.redirect(301, to))
}

// redirect non-English URLs to English URLs
app.get('/:lang([a-z][a-z])/node/:id([0-9]+)', (req, res, next) => {
  const { lang, id } = req.params
  if (lang === 'en') {
    next()
  } else {
    res.redirect(`/en/node/${id}`)
  }
})

// redirect old subject URLs to search page

for (const [url, id] of utils.readCsv('./data/eurovoc-ids.csv')) {
  app.get(url, (req, res) => res.redirect(`/vocabulary?subject=${uri}`))
}

for (const [url, uri] of utils.readCsv('./data/ddc-ids.csv')) {
  app.get(url, (req, res) => res.redirect(`/vocabulary?subject=${uri}`))
}

for (const [url, code] of utils.readCsv('./data/language-ids.csv')) {
  app.get(url, (req, res) => res.redirect(`/vocabulary?language=${code}`))
}

for (const [url, uri] of utils.readCsv('./data/kostype-ids.csv')) {
  app.get(url, (req, res) => res.redirect(`/vocabulary?type=${uri}`))
}

for (const [url, uri] of utils.readCsv('./data/license-ids.csv')) {
  app.get(url, (req, res) => res.redirect(`/vocabulary?license=${uri}`))
}


// root page
app.get('/', (req, res) => {
  req.params = { page: 'index' }
  page(req, res)
})

// search
app.get('/vocabularies', async (req, res, next) => {
  const { query } = req
  if (query.uri) {
    const item = (await provider.getSchemes({ uri: query.uri }))[0] || cachedVocs[uri]
    if (item) {
      sendItem(req, res, item)
    } else {
      next()
    }
  } else {
    // TODO: implement filter by query
    var result = Object.values(cachedVocs).concat(await provider.getSchemes(query))
    render(req, res, 'vocabularies', { title: 'Vocabularies', result })
  }
})


// Statistics
app.get('/stats', async (req, res) => {
  render(req, res, 'stats', { title: 'Statistics' })
})

// format page
app.get('/en/Format/:id', async (req, res, next) => {
  const uri = `http://bartoc.org/en/Format/${req.params.id}`
  const item = await provider.getConcept({ uri })
  if (item) {
    sendItem(req, res, item)
  } else {
    next()
  }
})

// static pages
app.get('/:page([a-z-]+)', page)
app.get('/([a-z][a-z])/:page([a-z-]+)', (req, res) => {
  res.redirect(`/${req.params.page}`)
})

// list of terminology registries
app.get('/registries', (req, res) => {
  render(req, res, 'registries', { title: 'Terminology Registries' })
})

// BARTOC id
app.get('/en/node/:id([0-9]+)', async (req, res, next) => {
  const uri = `http://bartoc.org/en/node/${req.params.id}`
  var { path } = req

  var item = registries[uri]
  if (item) {
    path = '/registries'
  } else {
    path = '/vocabularies'
    if (uri in cachedVocs) {
      item = cachedVocs[uri]
    } else {
      item = (await provider.getSchemes({ id: uri }))[0]
    }
  }

  if (item) {
    sendItem(req, res, item, { path })
  } else {
    next()
  }
})

const viewsByType = {
  'http://www.w3.org/2004/02/skos/core#Concept': 'concept',
  'http://www.w3.org/2004/02/skos/core#ConceptScheme': 'vocabulary',
  'http://purl.org/cld/cdtype/CatalogueOrIndex': 'registry'
}

const jskosContext = require('./static/context.json')

async function sendItem (req, res, item, vars = {}) {
  if (req.query.format === 'json') {
    item['@context'] = 'https://gbv.github.io/jskos/context.json'
    res.send([item])
  } else if (req.query.format === 'nt') {
    res.setHeader('Content-Type', 'application/n-triples')
    item['@context'] = jskosContext
    res.send(await jsonld.toRDF(item, { format: 'application/n-quads' }))
  } else {
    const view = viewsByType[item.type[0]]
    const title = utils.label(item.prefLabel).value
    render(req, res, view, { ...vars, item, title })
  }

  return true
}

function render (req, res, view, locals) {
  const { query, path } = req
  const vars = { config, query, path, utils, registries, repositories, nkostypes }
  return res.render(view, { ...vars, ...locals })
}


// Error handling
app.use((req, res, next) => {
  const title = 'Not found'

  res.status(404)
  if (req.query.format === 'json') {
    res.send([])
  } else if (req.query.format === 'nt') {
    res.type('txt').send(title)
  } else {
    render(req, res, '404', { title })
  }
})

// Start
app.listen(config.port, () => {
  config.log(`Listening on port ${config.port}`)
})

module.exports = { app }
