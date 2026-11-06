import config from "./config/index.js"
import utils from "./src/utils.js"
import { clone } from "./src/utils.js"
import jskos from "jskos-tools"
import querystring from "querystring"
import {
  rdfContentType,
  rdfResponseContentType,
  rdfSerialize,
} from "./src/rdf.js"
import { canonicalItemCopy } from "./src/itemSerialization.js"
import {
  deriveEditionRecord,
  hasValidVersionOf,
} from "./src/editions.js"
import { CONCEPT_SCHEME_TYPE, kosTypeUris } from "./src/terminology.js"
import { createServer as createHttpServer } from "node:http"
import portfinder from "portfinder"
import { getConceptsInBatches } from "./src/backend.js"
import { ReportsDirectory } from "./src/dvrf.js"
import { renderVueDocument } from "./src/vueDocument.js"
import { URL } from "url"
const __dirname = new URL(".", import.meta.url).pathname

const backend = config.registry

config.log(`Running in ${config.env} mode.`)

// Initialize express with settings
import express from "express"
const app = express()
const httpServer = createHttpServer(app)
app.set("json spaces", 2)

let vueRenderer
if (config.env === "development") {
  // One Vite instance serves browser modules and renders Vue on the server.
  const { createServer } = await import("vite")
  const vite = await createServer({
    server: { middlewareMode: true, hmr: { server: httpServer } },
    appType: "custom",
  })
  app.use(vite.middlewares)
  vueRenderer = () => vite.ssrLoadModule("/vue/entry-server.js")
} else {
  // Production needs both builds before it can accept requests.
  config.vue.manifest = utils.readJson(__dirname, "dist/.vite/manifest.json")
  if (!config.vue.manifest["vue/main.js"]?.file) {
    throw new Error("Vite manifest is missing the vue/main.js entry")
  }
  const renderer = await import("./dist/server/entry-server.js")
  vueRenderer = () => renderer
}

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

import redirectsRoute from "./routes/redirects.js"
import apiRoute from "./routes/api.js"
import uriRoute from "./routes/uri.js"
import createQualityRoute from "./routes/quality.js"
import createSparqlRoute from "./routes/sparql.js"

app.use(redirectsRoute)
app.use("/api", apiRoute)
app.use(uriRoute)

app.use(createSparqlRoute({
  endpoint: config.sparql,
  examples: config.sparqlExamples,
  render: sendVuePage,
}))

app.get("/software", (req, res, next) => sendVuePage(req, res, {
  title: "Software",
  vuePage: "software",
}).catch(next))

app.get("/download", (req, res, next) => sendVuePage(req, res, {
  title: "Download",
  vuePage: "download",
}).catch(next))

app.get("/contributing", (req, res, next) => sendVuePage(req, res, {
  title: "Contributing",
  vuePage: "contributing",
}).catch(next))

app.get("/about", (req, res, next) => sendVuePage(req, res, {
  title: "About",
  vuePage: "about",
}).catch(next))

app.get("/contact", (req, res, next) => sendVuePage(req, res, {
  vuePage: "contact",
}).catch(next))

app.get("/top-rated-points", (req, res, next) => sendVuePage(req, res, {
  vuePage: "topRatedPoints",
}).catch(next))

app.get(["/", "/index"], async (req, res, next) => {
  try {
    const schemes = await backend.getSchemes({ params: { limit: 1 } })
    await sendVuePage(req, res, {
      vuePage: "home",
      vuePageProps: { schemesCount: schemes?._totalCount ?? 0 },
    })
  } catch (error) {
    next(error)
  }
})

// Render the Vue page and send the complete HTML response.
async function sendVuePage(req, res, locals) {
  const { query, path } = req
  const renderer = await vueRenderer()
  // Render and hydrate the same JSON-safe values.
  const pageProps = JSON.parse(utils.serializeJsonForHtml(locals.vuePageProps || {}))
  const footer = {
    siteName: config.name,
    itemUri: locals.item?.uri || "",
    resourcePath: locals.resourcePath || path,
    api: locals.api || "",
    query,
  }
  const header = { activePath: locals.path || path, userCanAdd: false }
  // Public login settings come from the running server, not the browser build.
  const state = {
    page: locals.vuePage,
    pageProps,
    footer,
    header: { activePath: header.activePath },
    login: { api: config.login.api, ssl: config.login.ssl },
  }
  const html = await renderer.renderVuePage({
    page: state.page,
    pageProps,
    footer,
    header,
  })
  return res.type("html").send(renderVueDocument({
    config,
    title: locals.title,
    item: locals.item,
    stylesheets: locals.stylesheets,
    scripts: locals.scripts,
    state,
    html,
  }))
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

  return sendVuePage(req, res, {
    title,
    vuePage: "edit",
    vuePageProps: {
      title,
      item: item || null,
      versionMain,
      cancelUrl: item ? utils.uriLink(item.uri) : "/",
      hasIncomingVersions,
    },
  }).catch(next)
})

// vocabulary search should be delivered by bartoc-search instead
app.get("/vocabularies", (req, res, next) => sendVuePage(req, res, {
  title: "Missing bartoc-search",
  vuePage: "missingSearch",
}).catch(next))

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

// Add registry titles to references shown on the terminology page.
// Keep the original URI references when they cannot be resolved.
async function resolveRegistryReferences(references) {
  const refs = (references || []).filter(reference => reference?.uri)
  if (!refs.length) {
    return []
  }

  try {
    // The data endpoint can resolve several JSKOS item types in one request.
    const api = `${config.backend.api}data?${querystring.stringify({
      uri: refs.map(reference => reference.uri).join("|"),
    })}`
    const records = await fetch(api).then(response => response.json())

    return refs.map(reference => {
      const registry = records.find(record => record.uri === reference.uri)
      return registry ? jskos.clean(registry) : reference
    })
  } catch (error) {
    config.warn(
      "Could not resolve registry references. Keeping URI references.",
      error,
    )
    return refs
  }
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

/**
 * Add labels and incoming links needed by the page without changing stored data.
 */
async function enrichItem (storedItem, { resolvedVersionOf } = {}) {
  const item = clone(storedItem)

  const subjects = item && item.subject || []
  const conceptFields = ["ACCESS", "FORMAT"]
  const kosTypes = item.type?.[0] === CONCEPT_SCHEME_TYPE
    ? kosTypeUris(item)
    : []

  // Resolve all concept references in one backend request. KOS types are
  // included in the lookup but kept separate from item.type, which must remain
  // an array of URI strings.
  const conceptReferences = [
    ...subjects,
    ...kosTypes.map(uri => ({ uri })),
    ...conceptFields.flatMap(field => item[field] || []),
  ]
    .filter(reference => reference?.uri)

  // Load labels from JSKOS Server for every concept reference displayed by
  // the page. Each original reference remains available as fallback.
  let foundByUri = new Map()
  if (conceptReferences.length) {
    try {
      const found = (await getConceptsInBatches(backend, conceptReferences)).filter(Boolean)
      foundByUri = new Map(found.map(concept => [concept.uri, concept]))
    } catch (error) {
      config.warn(
        "Could not resolve concept metadata from backend. Keeping unresolved references.",
        error,
      )
    }
  }

  if (subjects.length) {
    // Subject references may contain record-specific metadata such as MAPPING,
    // so add the resolved labels without replacing the original reference.
    item.subject = subjects.map(subject => {
      const resolved = foundByUri.get(subject.uri)
      return resolved ? mergeSubjectMetadata(subject, resolved) : subject
    })
  }

  // Access and format references need no record-specific metadata merge. Use
  // the resolved concept when available and otherwise keep the original.
  for (const field of conceptFields) {
    if (Array.isArray(item[field])) {
      item[field] = item[field].map(reference => (
        foundByUri.get(reference.uri) || reference
      ))
    }
  }

  // Vue needs full KOS type concepts for their labels while the item keeps the
  // original URI strings. Missing concepts fall back to their URI in ItemAbout.
  const nkosTypes = Object.fromEntries(
    kosTypes
      .map(uri => [uri, foundByUri.get(uri)])
      .filter(([, concept]) => concept),
  )

  // Direct relations are saved as URI references. Load their labels for display.
  if (resolvedVersionOf !== undefined) {
    // The main record was already loaded to derive this edition.
    item.versionOf = structuredClone(resolvedVersionOf)
  } else if (item?.versionOf?.length) {
    item.versionOf = await resolveSchemeReferences(item.versionOf)
  }

  if (item?.basedOn?.length) {
    item.basedOn = await resolveSchemeReferences(item.basedOn)
  }

  if (item?.replacedBy?.length) {
    item.replacedBy = await resolveSchemeReferences(item.replacedBy)
  }

  // partOf points to registries, which use a different lookup.
  if (item?.partOf?.length) {
    item.partOf = await resolveRegistryReferences(item.partOf)
  }

  // Find other schemes that point to this one. These links exist only on the page.
  for (let key of ["versionOf", "basedOn", "replacedBy"]) {
    const backlinks = await resolveIncomingSchemeReferences(item, key)
    if (backlinks.length) {
      item[`_${key}Backlink`] = backlinks
    }
  }

  return { item, nkosTypes }
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
    const derivation = deriveEditionRecord(storedItem, mainItem)
    effectiveItem = derivation.effectiveItem
    derivedFields = derivation.derivedFields
  }

  // Enrichment runs after derivation so inherited concept references receive
  // labels too.
  const { item: presentationItem, nkosTypes } = await enrichItem(
    effectiveItem,
    { resolvedVersionOf },
  )
  return { presentationItem, derivedFields, nkosTypes }
}

// Quality reports and statistics
const reports = new ReportsDirectory(`${__dirname}data/reports`)
app.use("/quality", createQualityRoute({ reports }))

app.get("/stats", async (req, res, next) => {
  backend.getSchemes({ params: { limit: 1 } })
    .then(schemes => {
      return sendVuePage(req, res, {
        title: "Statistics",
        vuePage: "stats",
        stylesheets: ["/css/stats.css"],
        vuePageProps: {
          reports: reports.getSummaries(),
          schemesCount: schemes._totalCount,
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
app.get("/registries", (req, res, next) => {
  if (req.query.format === "jskos") {
    return res.redirect("/api/registries?limit=1000")
  }
  return sendVuePage(req, res, {
    title: "Terminology Registries",
    vuePage: "registries",
  }).catch(next)
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
    try {
      return await sendItem(req, res, storedItem, { path, ...presentationView })
    } catch (error) {
      return next(error)
    }
  } else {
    return next()
  }
})

async function backendDataByUri(uri) {
  const api = `${config.backend.api}data?${querystring.stringify({ uri })}`
  const items = await fetch(api).then(res => res.json())
  return items.find(item => item.uri === uri)
}

const vuePagesByType = {
  "http://www.w3.org/2004/02/skos/core#Concept": "concept",
  "http://www.w3.org/2004/02/skos/core#ConceptScheme": "terminology",
  "http://www.w3.org/ns/dcat#Catalog": "registry",
}

async function sendItem (
  req,
  res,
  storedItem,
  {
    presentationItem = storedItem,
    derivedFields = {},
    nkosTypes = {},
    ...vars
  } = {},
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
      const title = utils.label(item.prefLabel).value
      await sendVuePage(req, res, {
        ...vars,
        item,
        title,
        ...(vuePage && {
          vuePage,
          vuePageProps: {
            item,
            title,
            ...(vuePage === "terminology" && {
              nkosTypes,
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
app.use(async (req, res, next) => {

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
    return sendVuePage(req, res, {
      title: title,
      vuePage: "notFound",
    }).catch(next)

  }
})

// Backend error or another kind of bug
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }
  const title = err.message || "Technical problems"
  res.status(500)
  sendVuePage(req, res, {
    title,
    vuePage: "error",
    vuePageProps: {
      title,
      message: String(err),
    },
  }).catch(next)
})

// Start service
async function start() {
  // Find available port on test
  let port = config.port
  if (config.env == "test") {
    portfinder.basePort = config.port
    port = await portfinder.getPortPromise()
  }

  httpServer.listen(port, () => config.log(`Now listening on port ${port}`))
}

start()

export default app
