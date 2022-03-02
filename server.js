import config from "./config/index.js"
import utils from "./src/utils.js"
import path from "path"
import jskos from "jskos-tools"
import fs from "fs"
import querystring from "querystring"
import { rdfContentType, rdfSerialize } from "./src/rdf.js"
import child_process from "child_process"
import portfinder from "portfinder"

import { URL } from "url"
const __dirname = new URL(".", import.meta.url).pathname

const readNDJSON = file => fs.readFileSync(`${__dirname}${file}`).toString()
  .split(/\n|\n\r/).filter(Boolean).map(line => JSON.parse(line))

// build our vue project on first run if report.json can't be found
// TODO: We could create a Promise and make the first request(s) wait for that Promise to be fulfilled.
if (config.env !== "development") {
  console.log("Building Vue project in background... (old Vue files might be served in the meantime)")
  child_process.exec("npm run build", { env: process.env }, (error) => {
    if (error) {
      console.warn("Vue build failed!", error)
    } else {
      console.log("Vue project built successfully.")
    }
  })
}

const backend = config.registry

// static data (this could also be loaded from registry on startup)
const registries = utils.indexByUri(readNDJSON("./data/registries.ndjson"))
const nkostypes = utils.indexByUri(readNDJSON("./data/nkostype.concepts.ndjson"))
const accesstypes = utils.indexByUri(readNDJSON("./data/bartoc-access.concepts.ndjson"))
const formats = utils.indexByUri(readNDJSON("./data/bartoc-formats.concepts.ndjson"))

config.log(`Running in ${config.env} mode.`)

const repoType = "http://bartoc.org/full-repository"
const repositories = utils.indexByUri(Object.values(registries).filter(item => item.type.find(type => type === repoType)))
config.log(`Read ${Object.keys(registries).length} registries, ${Object.keys(repositories).length} also being repositories or services.`)

// Initialize express with settings
import express from "express"
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


import redirectsRoute from "./routes/redirects.js"
import apiRoute from "./routes/api.js"
import uriRoute from "./routes/uri.js"
import pageRoute from "./routes/page.js"

app.use(redirectsRoute)
app.use("/api", apiRoute)
app.use(uriRoute)
app.use(pageRoute)

// render HTML page with EJS
function render (req, res, view, locals) {
  const { query, path } = req
  // pass environment
  const vars = { config, query, path, utils, querystring, registries, repositories, nkostypes, accesstypes, formats, page: path.replace(/^\/|\/$/g, "") }
  return res.render(view, { ...vars, ...locals })
}

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
app.get("/stats", async (req, res, next) => {
  backend.getSchemes({ params: { limit: 1 } })
    .then(schemes => {
      const schemesCount = schemes._totalCount
      const reportsDir = `${__dirname}data/reports`
      const reports = fs.existsSync(reportsDir) ? fs.readdirSync(reportsDir) : []
      render(req, res, "stats", {
        title: "Statistics",
        reports,
        schemesCount,
        registriesCount: Object.keys(registries).length,
        repositoriesCount: Object.keys(repositories).length,
      })
    })
    .catch(e => { next(e) })
})

// Serve an individual concept with given prefix
function conceptPageHandler(prefix) {
  return async (req, res, next) => {
    const uri = prefix + req.params.id
    backend.getConcepts({ concepts: [{ uri }] })
      .then(concepts => concepts.length ? sendItem(req, res, concepts[0]) : next())
      .catch(next)
  }
}

// TODO: ILC is not in the BARTOC registry yet
app.get("/ILC/1/:id([a-z0-9-]+)", conceptPageHandler("https://bartoc.org/ILC/1/") )

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
    path = "/vocabularies"
    req.query.uri = uri
    return vocabulariesSearch({ path, ...req}, res, next)
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
  res.status(500)
  render(req, res, "500", { title: err.message, message: err + "" })
})

// Start service
async function start() {

  // Find available port on test
  let port = config.port
  if (config.env == "test") {
    portfinder.basePort = config.port
    port = await portfinder.getPortPromise()
  }

  // Let's go!
  app.listen(port, () => {
    config.log(`Now listening on port ${port}`)
  })
}

start()

export default app
