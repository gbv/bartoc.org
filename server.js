import config from "./config/index.js"
import utils from "./src/utils.js"
import path from "path"
import jskos from "jskos-tools"
import fs from "fs"
import querystring from "querystring"
import {
  rdfContentType,
  rdfResponseContentType,
  rdfSerialize,
} from "./src/rdf.js"
import { canonicalItemCopy } from "./src/itemSerialization.js"
import { deriveVersionRecord, hasValidVersionOf } from "./src/versioning.js"
import child_process from "child_process"
import portfinder from "portfinder"
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

// TODO: this should come from database as well
const nkostypes = utils.indexByUri((utils.readNdjson(__dirname,"./data/nkostype.concepts.ndjson")))
const accesstypes = utils.indexByUri(utils.readNdjson(__dirname, "./data/bartoc-access.concepts.ndjson"))
const formats = utils.indexByUri(utils.readNdjson(__dirname, "./data/bartoc-formats.concepts.ndjson"))

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
app.use(
  "/vendor/gbv-login-client-vue/",
  express.static("node_modules/gbv-login-client-vue/dist"),
)
app.use(
  "/vendor/bartoc-components/",
  express.static("node_modules/@gbv/bartoc-components/dist"),
)
app.use(
  "/vendor/yasgui/",
  express.static("node_modules/@matdata/yasgui/build"),
)
app.use(
  "/vendor/fontawesome/",
  express.static("node_modules/@fortawesome/fontawesome-free"),
)


import redirectsRoute from "./routes/redirects.js"
import apiRoute from "./routes/api.js"
import uriRoute from "./routes/uri.js"
import pageRoute from "./routes/page.js"
import createSparqlRoute from "./routes/sparql.js"

app.use(redirectsRoute)
app.use("/api", apiRoute)
app.use(uriRoute)

app.use(createSparqlRoute({
  endpoint: config.sparql,
  examples: config.sparqlExamples,
  render,
}))

app.use(pageRoute)

// render HTML page with EJS
function render (req, res, view, locals) {
  const { query, path } = req
  const vuePagePropsJson = locals.vuePageProps === undefined
    ? ""
    : utils.serializeJsonForHtml(locals.vuePageProps)
  // pass environment
  const vars = {
    config,
    query,
    path,
    // Keep the requested resource path separate from the active navigation path.
    resourcePath: path,
    utils,
    querystring,
    nkostypes,
    accesstypes,
    formats,
    page: path.replace(/^\/|\/$/g, ""),
  }
  return res.render(view, { ...vars, ...locals, vuePagePropsJson })
}

// edit form
app.get("/edit", async (req, res, next) => {
  const { uri } = req.query
  let item, title = "Add vocabulary"
  let hasIncomingVersions = false
  let versionMain = null

  if (uri) {
    item = await backend.getSchemes({ params: { uri } }).then(result => result[0])
    title = "Edit vocabulary"
    if (item) {
      utils.cleanupItem(item)
      delete item.concepts
      delete item.topConcepts
      const [incomingVersions, resolvedVersionMain] = await Promise.all([
        resolveIncomingSchemeReferences(item, "versionOf"),
        resolveDirectVersionMain(item),
      ])
      hasIncomingVersions = incomingVersions.length > 0
      versionMain = resolvedVersionMain
    } else {
      next()
      return
    }
  }

  render(req, res, "vue-page", {
    title,
    vuePage: "edit",
    vuePageProps: {
      title,
      item: item || null,
      versionMain,
      cancelUrl: item ? utils.uriLink(item.uri) : "/",
      hasIncomingVersions,
    },
  })
})

// vocabulary search should be delivered by bartoc-search instead
app.get("/vocabularies", (req, res) => render(req, res, "vue-page", {
  title: "Missing bartoc-search",
  vuePage: "missingSearch",
}))

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

async function resolveSchemeReferences(references) {
  const refs = (references || []).filter(ref => ref?.uri)
  if (!refs.length) {
    return []
  }

  const found = await Promise.all(
    refs.map(({ uri }) =>
      backend.getSchemes({ params: { uri } })
        .then(result => result[0] || null)
        .catch(() => null),
    ),
  )

  // Direct relation fields store only URI references. The view needs labels, so
  // resolve them to full schemes when possible.
  const resolved = found.filter(Boolean).map(jskos.clean)
  const resolvedUris = new Set(resolved.map(item => item.uri))

  // Keep unresolved references visible instead of silently dropping them.
  return [
    ...resolved,
    ...refs.filter(ref => !resolvedUris.has(ref.uri)),
  ]
}

/**
 * Load the main record referenced by versionOf for the editor.
 * Keep it separate from the editable item so inherited values are not saved.
 * Return null if the reference is invalid or the main record cannot be loaded.
 */
async function resolveDirectVersionMain(item) {
  if (!hasValidVersionOf(item)) {
    return null
  }

  const uri = item.versionOf[0].uri.trim()

  try {
    const result = await backend.getSchemes({ params: { uri } })
    const main = result?.find(candidate => candidate?.uri === uri)
    return main ? jskos.clean(main) : null
  } catch (error) {
    config.warn(`Could not load version main record ${uri}.`, error)
    return null
  }
}

/**
 * Find schemes that point to this item through the given relation.
 * These backlinks are computed for display and are never saved.
 * Return an empty list if the lookup fails.
 */
async function resolveIncomingSchemeReferences(item, relation) {
  if (!item?.uri || !item.type?.includes("http://www.w3.org/2004/02/skos/core#ConceptScheme")) {
    return []
  }

  try {
    // Reverse relations are not stored on this item. They are found by asking
    // the backend for all schemes that point to the current URI.
    const result = await backend.getSchemes({
      params: {
        [relation]: item.uri,
        limit: 1000,
      },
    })

    return (result || [])
      .filter(scheme => scheme?.uri && scheme.uri !== item.uri)
      .map(jskos.clean)
  } catch (error) {
    config.warn(`Could not resolve incoming ${relation} relations for ${item.uri}.`, error)
    return []
  }
}

async function enrichItem (storedItem, { resolvedVersionOf } = {}) {
  // Presentation enrichment must never consume the only canonical copy.
  const item = structuredClone(storedItem)
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

  // Direct relations are stored on this item and can be edited there.
  if (resolvedVersionOf !== undefined) {
    // Reuse the main record loaded for derivation instead of fetching it twice.
    item.versionOf = structuredClone(resolvedVersionOf)
  } else if (item?.versionOf?.length) {
    item.versionOf = await resolveSchemeReferences(item.versionOf)
  }

  if (item?.basedOn?.length) {
    item.basedOn = await resolveSchemeReferences(item.basedOn)
  }

  // Add backlinks for selected fields
  for (let key of ["versionOf", "basedOn"]) {
    const backlinks = await resolveIncomingSchemeReferences(item, key)
    if (backlinks.length) {
      item[`_${key}Backlink`] = backlinks
    }
  }

  return item
}

async function buildPresentationView(storedItem) {
  let effectiveItem = storedItem
  let derivedFields = {}
  let resolvedVersionOf

  if (hasValidVersionOf(storedItem)) {
    // Resolve exactly the direct main relation. The pure kernel decides
    // whether the loaded record is a usable inheritance source.
    resolvedVersionOf = await resolveSchemeReferences(storedItem.versionOf)
    const mainItem = resolvedVersionOf[0]
    const derivation = deriveVersionRecord(storedItem, mainItem)
    effectiveItem = derivation.effectiveItem
    derivedFields = derivation.derivedFields
  }

  // Enrichment runs after derivation so inherited subjects receive labels too.
  const presentationItem = await enrichItem(effectiveItem, { resolvedVersionOf })
  return { presentationItem, derivedFields }
}

// Statistics
app.get("/stats", async (req, res, next) => {
  backend.getSchemes({ params: { limit: 1 } })
    .then(schemes => {
      const schemesCount = schemes._totalCount
      const reportsDir = `${__dirname}data/reports`
      const reports = fs.existsSync(reportsDir) ? fs.readdirSync(reportsDir) : []
      render(req, res, "vue-page", {
        title: "Statistics",
        vuePage: "stats",
        vuePageProps: {
          reports,
          schemesCount,
        },
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
      .then(concepts => concepts.length && concepts[0] ? sendItem(req, res, concepts[0]) : next())
      .catch(next)
  }
}

// TODO: ILC is not in the BARTOC registry yet
app.get("/ILC/1/:id([a-z0-9-]+)", conceptPageHandler("https://bartoc.org/ILC/1/") )

// list of terminology registries
app.get("/registries", (req, res) => {
  if (req.query.format === "jskos") {
    return res.redirect("/api/registries?limit=1000")
  }
  render(req, res, "vue-page", {
    title: "Terminology Registries",
    vuePage: "registries",
  })
})

// BARTOC ID => registry or vocabulary (if found)
app.get("/en/node/:id([0-9]+)", async (req, res, next) => {
  const uri = `http://bartoc.org/en/node/${req.params.id}`

  let path = "/vocabularies"
  let item

  try {
    item = await backendDataByUri(uri)
  } catch (error) {
    config.warn(`Could not load item ${uri} from backend data endpoint.`, error)
  }

  if (!item) {
    try {
      const result = await backend.getSchemes({ properties: "*", params: { uri } })
      if (result.length === 1) {
        item = result[0]
      }
    } catch (error) {
      return next(error)
    }
  }

  if (item) {
    const storedItem = item
    const { format } = req.query
    const isCanonicalFormat = format === "json" ||
      format === "jsonld" ||
      Boolean(rdfContentType[format])
    // Machine-readable formats do not need labels or computed backlinks.
    const presentationView = isCanonicalFormat
      ? { presentationItem: storedItem, derivedFields: {} }
      : await buildPresentationView(storedItem)
    path = storedItem.type?.[0] === "http://www.w3.org/ns/dcat#Catalog"
      ? "/registries"
      : "/vocabularies"
    return sendItem(req, res, storedItem, { path, ...presentationView })
  } else {
    return next()
  }
})

async function backendDataByUri(uri) {
  const api = `${config.backend.api}data?${querystring.stringify({ uri })}`
  const items = await fetch(api).then(res => res.json())
  return items.find(item => item.uri === uri)
}

const viewsByType = {
  "http://www.w3.org/ns/dcat#Catalog": "registry",
}

const vuePagesByType = {
  "http://www.w3.org/2004/02/skos/core#Concept": "concept",
  "http://www.w3.org/2004/02/skos/core#ConceptScheme": "terminology",
}

async function sendItem (
  req,
  res,
  storedItem,
  { presentationItem = storedItem, derivedFields = {}, ...vars } = {},
) {
  const { format } = req.query
  if (format === "json" || format === "jsonld") {
    const item = canonicalItemCopy(
      storedItem,
      "https://gbv.github.io/jskos/context.json",
    )
    res.send([item])
  } else {
    const type = rdfContentType[format]
    if (type) {
      res.setHeader(
        "Content-Type",
        rdfResponseContentType(format, req.query.inline === "1"),
      )
      res.send(await rdfSerialize(storedItem, format))
    } else {
      const item = presentationItem
      const itemType = item.type[0]
      const vuePage = vuePagesByType[itemType]
      const view = vuePage ? "vue-page" : viewsByType[itemType]
      const title = utils.label(item.prefLabel).value
      render(req, res, view, {
        ...vars,
        item,
        title,
        ...(vuePage && {
          vuePage,
          vuePageProps: {
            item,
            title,
            ...(vuePage === "terminology" && {
              nkosTypes: nkostypes,
              accessTypes: accesstypes,
              formats,
              derivedFields,
            }),
          },
        }),
      })
    }
  }

  return true
}

// Some vocabularies use the BARTOC namespace; we should cover these with a redirect
const schemesWithBartocNamespacePromise = backend.getSchemes({})
  .then(schemes => schemes.filter(s => s.namespace?.startsWith("http://bartoc.org")))
  .catch(error => {
    config.warn("Could not load BARTOC namespace redirect metadata from backend.", error)
    return []
  })

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
    render(req, res, "vue-page", {
      title: title,
      vuePage: "notFound",
    })

  }
})

// Backend error or another kind of bug
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }
  const title = err.message || "Technical problems"
  res.status(500)
  render(req, res, "vue-page", {
    title,
    vuePage: "error",
    vuePageProps: {
      title,
      message: String(err),
    },
  })
})

// Start service
async function start() {
  // Find available port on test
  let port = config.port
  if (config.env == "test") {
    portfinder.basePort = config.port
    port = await portfinder.getPortPromise()
  }

  app.listen(port, () => config.log(`Now listening on port ${port}`))
}

start()

export default app
