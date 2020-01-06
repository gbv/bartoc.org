const config = require("./config")
const page = require('./routes/page')

// static data
const ndjson = require('./utils/ndjson')
const csv = require('./utils/csv')
const registries = ndjson('./data/registries.ndjson')
const eurovoc = csv('./data/eurovoc-ids.csv')

config.log(`Running in ${config.env} mode.`)
config.log(`Read ${registries.length} registries.`)

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
  const to = `/search?subject=http://eurovoc.europa.eu/${id}`
  app.get(from, (req, res) => res.redirect(to))
}


// root page
app.get("/", (req, res) => {
  req.params = { page: 'index' }
  page(req, res)
})

// search
app.get("/search", (req, res) => {
  const { path, query } = req
  const title = "Search"
  res.render("search", { config, title, path, query })
})

// static pages
app.get("/:page([a-z-]+)", page)
app.get("/([a-z][a-z])/:page([a-z-]+)", (req, res) => {
  res.redirect(`/${req.params.page}`)
})

// list of terminology registries
app.get("/terminology-registries", (req, res) => {
  res.setHeader("Content-Type", "text/html")
  const { path } = req
  const title = "Terminology Registries"
  res.render("registries", { config, registries, title, path })
})

// BARTOC id
app.get("/en/node/:id([0-9]+)", async (req, res, next) => {
  var { path, query } = req
  const uri = 'http://bartoc.org/en/node/' + req.params.id

  var view = "vocabulary"
  var title

  // lookup URI as registry
  var item = registries.find(item => item.uri == uri)
  if (item) {
    title = item.prefLabel.en
    path = "/terminology-registries"
    view = "registry"
  } else {
      // TODO: lookup URI as terminology
    item = {
      prefLabel: { en: "Dummy record" },
      definition: { en: ["this record is only shown for testing"] }
    }
    title = item.prefLabel.en
  }

  if (item) {
    item["@context"] = "https://gbv.github.io/jskos/context.json"

    if (query.format === "json") {
      res.send([item])
    } else if (query.format === "nt") {
      res.setHeader("Content-Type", "application/n-triples")
      const jsonld = require("jsonld")
      
      // TODO: catch and handle errors? 
      item["@context"] = require('./static/context.json')
      const ntriples = await jsonld.toRDF(item, {format: 'application/n-quads'})

      res.send(ntriples)
    } else {
      res.setHeader("Content-Type", "text/html")
      res.render(view, { config, item, title, path })
    }
  } else {
    next()
  }
})

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
    res.render("404", { config, title, path })
  }
})

// Start
app.listen(config.port, () => {
  config.log(`Listening on port ${config.port}`)
})

module.exports = { app }
