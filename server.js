const config = require("./config")
const page = require('./routes/page')
const provider = require('./src/provider')()
const utils = require('./src/utils')

// static data
const ndjson = require('./utils/ndjson')
const csv = require('./utils/csv')
const registries = ndjson('./data/registries.ndjson')
const eurovoc = csv('./data/eurovoc-ids.csv')

config.log(`Running in ${config.env} mode.`)

const repoType = "http://bartoc.org/full-repository"
const repositories = registries.filter(item => item.type.find(type => type === repoType))
config.log(`Read ${registries.length} registries, ${repositories.length} also being repositories or services.`)

// Initialize express with settings
const express = require("express")
const app = express()
app.set("json spaces", 2)

// Configure view engine to render EJS templates.
app.set("views", __dirname + "/views")
app.set("view engine", "ejs")

// static assets
app.use(express.static('static'))

// redirect permanently moved URLs from legacy BARTOC.org
for (let [from, to] of Object.entries(config.redirects)) {
  app.get(from, (req, res) => res.redirect(301, to))
}

// redirect non-English URLs to English URLs
app.get("/:lang([a-z][a-z])/node/:id([0-9]+)", (req, res, next) => {
  const { lang, id } = req.params
  if (lang === "en") {
    next()
  } else {
    res.redirect(`/en/node/${id}`)
  }
})

// redirect old topic URLs to search page
for (let [from, id] of eurovoc) {
  const to = `/vocabulary?subject=http://eurovoc.europa.eu/${id}`
  app.get(from, (req, res) => res.redirect(to))
}


// root page
app.get("/", (req, res) => {
  req.params = { page: 'index' }
  page(req, res)
})

// search
app.get("/vocabularies", async (req, res) => {
  var result = await provider.getSchemes()
  render(req, res, "vocabularies", { title: "Vocabularies", result })
})

// Statistics
app.get("/stats", async (req, res) => {
  render(req, res, "stats", { title: "Statistics" })
})

// static pages
app.get("/:page([a-z-]+)", page)
app.get("/([a-z][a-z])/:page([a-z-]+)", (req, res) => {
  res.redirect(`/${req.params.page}`)
})

// list of terminology registries
app.get("/registries", (req, res) => {
  render(req, res, "registries", { title: "Terminology Registries" })
})

// BARTOC id
app.get("/en/node/:id([0-9]+)", async (req, res, next) => {
  var { path, query } = req
  const uri = `http://bartoc.org/en/node/${req.params.id}`

  var item = registries.find(item => item.uri == uri)
  if (item) {
    path = "/registries"
  } else {
    item = (await provider.getSchemes({ id: uri }))[0]
  }

  if (item) {
    sendItem(res, item, query.format, path)
  } else {
    next()
  }
})

async function sendItem(res, item, format, path) {
  item["@context"] = "https://gbv.github.io/jskos/context.json"

  if (format === "json") {
    res.send([item])
  } else if (format === "nt") {
    res.setHeader("Content-Type", "application/n-triples")
    const jsonld = require("jsonld")

    // TODO: catch and handle errors?
    item["@context"] = require('./static/context.json')
    const ntriples = await jsonld.toRDF(item, {format: 'application/n-quads'})

    res.send(ntriples)
  } else {
    const view = item.type[0] === "http://www.w3.org/2004/02/skos/core#ConceptScheme" ? "vocabulary" : "registry"
    // http://purl.org/cld/cdtype/CatalogueOrIndex
    const title = utils.label(item.prefLabel).value
    render({ query: {}, path }, res, view, { item, title, path })
  }
}

function render(req, res, view, locals) {
  const { query, path } = req
  return res.render(view, {
    config, query, path, utils, registries, repositories,
    ...locals
  })
}

/*
// Format
app.get("/en/Format/:format", async (req, res, next) => {
  var { path, query } = req

  const uri = `http://bartoc.org/en/node/${req.params.id}`

  console.log(
  next()

  // e.g. http://bartoc.org/en/Format/Zthes
})
*/

// handle 404 errors
app.use( (req, res, next) => {
  const { path, query } = req
  const title = "Not found"

  res.status(404)
  if (query.format === "json") {
    res.send([])
  } else if (query.format === "nt") {
    res.type("txt").send(title)
  } else {
    res.setHeader("Content-Type", "text/html")
    render(req, res, "404", { title })
  }
})

// Start
app.listen(config.port, () => {
  config.log(`Listening on port ${config.port}`)
})

module.exports = { app }
