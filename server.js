const config = require("./config")
const page = require("./routes/page")
const utils = require("./src/utils")
const path = require("path")
const jskos = require("jskos-tools")
const cdk = require("cocoda-sdk")
const fs = require("fs")
const axios = require("axios")
const querystring = require("querystring")
const { rdfContentType, rdfSerialize } = require("./src/rdf")

// build our vue project on first run if report.json can't be found
// TODO: We could create a Promise and make the first request(s) wait for that Promise to be fulfilled.
if (config.env !== "development") {
  console.log("Building Vue project in background... (old Vue files might be served in the meantime)")
  require("child_process").exec("npm run build", { env: process.env }, (error) => {
    if (error) {
      console.warn("Vue build failed!", error)
    } else {
      console.log("Vue project built successfully.")
    }
  })
}


const proxy = require("express-http-proxy")

let backend
try {
  backend = cdk.initializeRegistry(config.backend)
} catch (error) {
  backend = null
  console.error("Error: The backend could not be initialized! Please check the backend configuration in config/config.json!")
}

// static data (this could also be loaded from backend on startup)
const registries = utils.indexByUri(utils.readNdjson("./data/registries.ndjson"))
const nkostypes = utils.indexByUri(utils.readNdjson("./data/nkostype.concepts.ndjson"))
const accesstypes = utils.indexByUri(utils.readNdjson("./data/bartoc-access.concepts.ndjson"))
const formats = utils.indexByUri(utils.readNdjson("./data/bartoc-formats.concepts.ndjson"))

config.log(`Running in ${config.env} mode.`)

const repoType = "http://bartoc.org/full-repository"
const repositories = utils.indexByUri(Object.values(registries).filter(item => item.type.find(type => type === repoType)))
config.log(`Read ${Object.keys(registries).length} registries, ${Object.keys(repositories).length} also being repositories or services.`)

// Initialize express with settings
const express = require("express")
const app = express()
app.set("json spaces", 2)

// Configure view engine to render EJS templates.
app.set("views", path.join(__dirname, "/views"))
app.set("view engine", "ejs")

// static assets
app.use(express.static("static"))
app.use("/data/dumps/", express.static("data/dumps"))
app.use("/data/reports/", express.static("data/reports"))
app.use("/dist/", express.static("dist"))

// redirect permanently moved URLs from legacy BARTOC.org
const redirects = require("./data/redirects.json")

for (const [from, to] of Object.entries(redirects)) {
  app.get(from, (req, res) => res.redirect(301, to))
}

// redirect non-language URLs to English URLs
app.get("/node/:id([0-9]+)", (req, res) => {
  res.redirect(`/en/node/${req.params.id}`)
})

// redirect non-English URLs to English URLs
app.get("/:lang([a-z][a-z])/node/:id([0-9]+)", (req, res, next) => {
  const { lang, id } = req.params
  if (lang === "en") {
    next()
  } else {
    res.redirect(`/en/node/${id}`)
  }
})

// redirect old subject URLs to vocabulary search

for (const [url, uri] of utils.readCsv("./data/eurovoc-ids.csv")) {
  app.get(url, (req, res) => res.redirect(`/vocabularies?subject=${uri}`))
}

for (const [url, uri] of utils.readCsv("./data/ddc-ids.csv")) {
  app.get(url, (req, res) => res.redirect(`/vocabularies?subject=${uri}`))
}

for (const [url, code] of utils.readCsv("./data/language-ids.csv")) {
  app.get(url, (req, res) => res.redirect(`/language/${code}`))
}

for (const [url, uri] of utils.readCsv("./data/kostype-ids.csv")) {
  app.get(url, (req, res) => res.redirect(`/vocabularies?type=${uri}`))
}

for (const [url, uri] of utils.readCsv("./data/license-ids.csv")) {
  app.get(url, (req, res) => res.redirect(`/vocabularies?license=${uri}`))
}

for (const [url, uri] of utils.readCsv("./data/access-ids.csv")) {
  app.get(url, (req, res) => res.redirect(`/vocabularies?access=${uri}`))
}

for (const [url, id] of utils.readCsv("./data/format-ids.csv")) {
  app.get(url, (req, res) => res.redirect(`/vocabularies?format=http://bartoc.org/en/Format/${id}`))
}

// backend
app.use("/api", (req, res, next) => {
  if (!req.originalUrl.startsWith("/api/")) {
    const query = req.url.slice(req.path.length)
    return res.redirect(301, `/api/${query}`)
  } else {
    // Deconstruct backend API URL to properly proxy requests.
    const url = new URL(config.backend.api)
    proxy(url.origin, {
      proxyReqPathResolver(req) {
        const path = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname
        return path + req.url
      },
    })(req, res, next)
  }
})

// if the backend was not initialize, throw error here
app.use((req, res, next) => {
  if (!backend) {
    // Note: We don't need any explanation here because we're handling this case in the error handling route.
    next(new Error())
  }
  next()
})

// edit form
app.get("/edit", async (req, res, next) => {
  const { uri } = req.query
  var item
  var title = "Add vocabulary"

  if (uri) {
    item = await backend.getSchemes({ params: { uri } }).then(result => result[0])
    title = "Edit vocabulary"
    if (item) {
      utils.cleanupItem(item)
      delete item.concepts
      delete item.topConcepts
    } else {
      next()
    }
  }

  render(req, res, "edit", { item, title, edit: true })
})

// vocabulary search
app.get("/vocabularies", vocabulariesSearch)

async function vocabulariesSearch (req, res, next) {
  const { query } = req

  var search = query.search
    ? backend.vocSearch({ properties: "*", search: query.search })
    : backend.getSchemes({ properties: "*", params: query })

  if (query.uri) {
    search = search.then(result => {
      if (result.length) {
        return result[0]
      } else {
        next()
      }
    })
      .then(enrichItem)
      .then(item => sendItem(req, res, item))
  } else {
    search =
    search.then(result => {
      render(req, res, "vocabularies", { title: "Vocabularies", result, api: "voc" })
    })
  }

  search.catch(e => { next(e) })
}

async function enrichItem (item) {
  const subjects = item.subject || []
  if (subjects.length) {
    const found = await backend.getConcepts({ concepts: item.subject })
    item.subject = found.map(jskos.clean)
    // add non-found subjects
    const uris = found.map(s => s.uri)
    for (const subj of subjects) {
      if (!uris.find(uri => uri === subj.uri)) {
        item.subject.push(subj)
      }
    }
  }
  return item
}

// Statistics
app.get("/stats", async (req, res) => {
  const url = `http://localhost:${config.port}/api/voc?limit=1`
  const totalCount = await axios.get(url).then(res => res.headers["x-total-count"])
  const reports = fs.existsSync("data/reports") ? fs.readdirSync("data/reports/") : []
  render(req, res, "stats", { title: "Statistics", totalCount, reports })
})

// Serve an individual concept
function conceptPageHandler(prefix) {
  return async (req, res, next) => {
    const uri = prefix + req.params.id
    backend.getConcepts({ concepts: [{ uri }] })
      .then(concepts => concepts.length ? sendItem(req, res, concepts[0]) : next())
      .catch(next)
  }
}

// ILC
app.get("/ILC/1", (req, res) => res.redirect("/en/node/472"))

app.get("/en/Format/:id", conceptPageHandler("http://bartoc.org/en/Format/") )

app.get("/language/:id([a-z]{2,3})", conceptPageHandler("https://bartoc.org/language/") )
/*for (const [url, code] of utils.readCsv("./data/language-ids.csv")) {
  app.get(url, (req, res) => res.redirect(`/vocabularies?languages=${code}`))
}
*/

// FIXME: ILC is not in the BARTOC backend yet
app.get("/ILC/1/:id([a-z0-9-]+)", conceptPageHandler("https://bartoc.org/ILC/1/") )


// root page
app.get("/", (req, res) => {
  req.params = { page: "index" }
  page(req, res)
})

// static pages
app.get("/:page([a-z-]+)", page)
app.get("/([a-z][a-z])/:page([a-z-]+)", (req, res) => {
  res.redirect(`/${req.params.page}`)
})

// list of terminology registries
app.get("/registries", (req, res) => {
  if (req.query.format === "jskos") {
    return res.send(registries)
  }
  render(req, res, "registries", { title: "Terminology Registries" })
})

// BARTOC ID => registry or vocabulary (if found)
app.get("/en/node/:id([0-9]+)", async (req, res, next) => {
  const uri = `http://bartoc.org/en/node/${req.params.id}`
  var { path } = req
  var item = registries[uri]

  if (item) {
    path = "/registries"
  } else {
    req.path = "/vocabularies"
    req.query.uri = uri
    return vocabulariesSearch(req, res, next)
    /*    path = '/vocabularies'
    // TODO: what if BARTOC URI is secondary identifier?
    item = await backend.getSchemes({ params: { uri } })
      .then(result => result[0])
      .catch(next) */
  }

  if (item) {
    sendItem(req, res, item, { path })
  } else {
    next()
  }
})

const viewsByType = {
  "http://www.w3.org/2004/02/skos/core#Concept": "concept",
  "http://www.w3.org/2004/02/skos/core#ConceptScheme": "vocabulary",
  "http://purl.org/cld/cdtype/CatalogueOrIndex": "registry",
}

async function sendItem (req, res, item, vars = {}) {
  const { format } = req.query
  if (format === "json" || format === "jsonld") {
    item["@context"] = "https://gbv.github.io/jskos/context.json"
    Object.keys(item).filter(key => key[0] === "_").forEach(key => delete item[key])
    res.send([item])
  } else {
    const type = rdfContentType[format]
    if (type) {
      res.setHeader("Content-Type", type)
      res.send(await rdfSerialize(item, format))
    } else {
      const view = viewsByType[item.type[0]]
      const title = utils.label(item.prefLabel).value
      render(req, res, view, { ...vars, item, title })
    }
  }

  return true
}

function render (req, res, view, locals) {
  const { query, path } = req
  const vars = { config, query, path, utils, querystring, registries, repositories, nkostypes, accesstypes, formats, page: path.replace(/^\/|\/$/g, "") }
  return res.render(view, { ...vars, ...locals })
}

// Error handling
app.use((req, res) => {
  const title = "Not found"

  res.status(404)
  if (req.query.format === "json") {
    res.send([])
  } else if (req.query.format === "nt") {
    res.type("txt").send(title)
  } else {
    render(req, res, "404", { title })
  }
})

// Backend error or another kind of bug
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }
  const errors = require("cocoda-sdk/errors")
  let message
  if (!backend) {
    message = "The backend was not configured properly."
  } else if (err instanceof errors.NetworkError) {
    message = `The backend was not reachable (status: ${err.code || (err.relatedError && err.relatedError.code)})`
  }
  // TODO: Handle more errors here.
  else {
    message = err.message
  }
  // TODO: Should the error be logged to the console?
  res.status(500)
  render(req, res, "500", { title: err.message, message })
})

// Start server
app.listen(config.port, () => {
  config.log(`Listening on port ${config.port}`)
})

module.exports = { app }
