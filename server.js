import config from "./config/index.js"
import utils from "./src/utils.js"
import path from "path"
import jskos from "jskos-tools"
import fs from "fs"
import querystring from "querystring"
import { rdfContentType, rdfSerialize } from "./src/rdf.js"
import child_process from "child_process"
import portfinder from "portfinder"
import {
  enrichRegistriesWithTerminologiesCounts,
  loadRegistriesFromFile,
  getRepositories,
  refreshRegistries,
  registriesApiUrl,
  jskosDataUrl,
} from "./src/registries.js"
import { getConceptsInBatches } from "./src/backend.js"
import { URL } from "url"
const __dirname = new URL(".", import.meta.url).pathname

// build our vue project on first run if report.json can't be found
// TODO: We could create a Promise and make the first request(s) wait for that Promise to be fulfilled.
if (config.env !== "development") {
  console.log("Building Vue project in background... (old Vue files might be served in the meantime)")
  child_process.exec("npm run build", { env: process.env }, (error) => {
    if (error) {
      console.warn("Vue build failed!", error)
    } else {
      console.log("Vue project built successfully.")
      // Add manifest to config
      const file = "dist/.vite/manifest.json"
      try {
        config.vue.manifest = utils.readJson(__dirname, file)
      } catch(error) {
        console.warn(`Could not read Vite manifest in ${file}, there might be issues with the front end build.`)
      }
    }
  })
}

const backend = config.registry

config.log(`Running in ${config.env} mode.`)

const nkostypes = utils.indexByUri((utils.readNdjson(__dirname,"./data/nkostype.concepts.ndjson")))
const accesstypes = utils.indexByUri(utils.readNdjson(__dirname, "./data/bartoc-access.concepts.ndjson"))
const formats = utils.indexByUri(utils.readNdjson(__dirname, "./data/bartoc-formats.concepts.ndjson"))


// Initial data: use the local file so the app has data immediately.
// This is replaced by backend data during startup if loading succeeds.
let registries = loadRegistriesFromFile()
let repositories = getRepositories(registries)

config.log(`Read ${Object.keys(registries).length} registries, ${Object.keys(repositories).length} also being repositories or services.`)

async function refreshRegistriesInBackground() {
  const refreshed = await refreshRegistries()
  registries = refreshed.registries
  repositories = refreshed.repositories

  if (refreshed.source === "backend") {
    await enrichRegistriesWithTerminologiesCounts(registries)
  }
}

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
  const vars = {
    config,
    query,
    path,
    utils,
    querystring,
    registries,
    repositories,
    nkostypes,
    accesstypes,
    formats,
    registriesApiUrl,
    jskosDataUrl,
    page: path.replace(/^\/|\/$/g, ""),
  }
  return res.render(view, { ...vars, ...locals })
}

// edit form
app.get("/edit", async (req, res, next) => {
  const { uri } = req.query
  let item, title = "Add vocabulary"

  if (uri) {
    item = await backend.getSchemes({ params: { uri } }).then(result => result[0])
    title = "Edit vocabulary"
    if (item) {
      utils.cleanupItem(item)
      delete item.concepts
      delete item.topConcepts
    } else {
      next()
      return
    }
  }

  render(req, res, "edit", { item, title, edit: true })
})

// vocabulary search should be delivered by bartoc-search instead
app.get("/vocabularies", (req, res) => render(req, res, "vocabularies", { title: "Missing bartoc-search" }))

function mergeSubjectMetadata(subject, resolved) {
  const cleaned = jskos.clean({
    ...resolved,
    ...subject,
    prefLabel: resolved.prefLabel || subject.prefLabel,
    notation: resolved.notation || subject.notation,
    type: resolved.type || subject.type,
  })

  return {
    ...cleaned,
    ...subject,
    prefLabel: cleaned.prefLabel || subject.prefLabel,
    notation: cleaned.notation || subject.notation,
    type: cleaned.type || subject.type,
  }
}

async function enrichItem (item) {
  const subjects = item && item.subject || []
  if (subjects.length) {
    let found = []
    try {
      found = (await getConceptsInBatches(backend, subjects)).filter(Boolean)
    } catch (error) {
      config.warn("Could not resolve subject metadata from backend. Keeping unresolved subject references.", error)
    }

    const foundByUri = new Map(found.map(concept => [concept.uri, concept]))
    item.subject = subjects.map(subject => {
      const resolved = foundByUri.get(subject.uri)
      return resolved ? mergeSubjectMetadata(subject, resolved) : subject
    })
  }

  const versionOf = item?.versionOf || []
  if (versionOf.length) {
    const found = await Promise.all(
      versionOf.map(({ uri }) =>
        backend.getSchemes({ params: { uri } })
          .then(result => result[0] || null)
          .catch(() => null),
      ),
    )
    item.versionOfResolved = found.map(jskos.clean)

    const uris = found.map(s => s.uri)
    for (const rel of versionOf) {
      if (!uris.find(uri => uri === rel.uri)) {
        item.versionOfResolved.push(rel)
      }
    }
  }

  const basedOn = item?.basedOn || []
  if (basedOn.length) {
    const found = await Promise.all(
      basedOn.map(({ uri }) =>
        backend.getSchemes({ params: { uri } })
          .then(result => result[0] || null)
          .catch(() => null),
      ),
    )

    item.basedOnResolved = found.map(jskos.clean)

    const uris = found.map(s => s.uri)
    for (const rel of basedOn) {
      if (!uris.find(uri => uri === rel.uri)) {
        item.basedOnResolved.push(rel)
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
    .catch(e => {
      next(e)
    })
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
  let path = "/vocabularies"
  let item = registries[uri]

  if (item) {
    path = "/registries"
  } else {
    try {
      const result = await backend.getSchemes({ properties: "*", params: { uri } })
      if (result.length === 1) {
        item = await enrichItem(result[0])
      }
    } catch (error) {
      next(error)
    }
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
  "http://www.w3.org/ns/dcat#Catalog": "registry",
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

// Some vocabularies use the BARTOC namespace; we should cover these with a redirect
const schemesWithBartocNamespacePromise = backend.getSchemes({}).then(schemes => schemes.filter(s => s.namespace?.startsWith("http://bartoc.org")))

// BARTOC namespace redirect + error handling
app.use(async (req, res) => {

  // Try to find whether the URL belongs to one of the vocabularies that use the BARTOC namespace
  const schemesWithBartocNamespace = await schemesWithBartocNamespacePromise
  const matchingScheme = schemesWithBartocNamespace.find(scheme => req.url.startsWith(scheme.namespace.replace("http://bartoc.org", "")))
  if (matchingScheme) {
    // If found, redirect to the "Content" tab
    return res.redirect(`${matchingScheme.uri.replace("http://bartoc.org", "")}?uri=${encodeURIComponent("http://bartoc.org" + req.url)}#content`)
  }

  // Handle 404
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

  app.listen(port, () => {
    config.log(`Now listening on port ${port}`)

    refreshRegistriesInBackground().catch(error => {
      config.warn("Could not refresh registries in background.", error)
    })
  })
}

start()

export default app
