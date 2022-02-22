import express from "express"
const router = express.Router()

import config from "../config/index.js"

const suffix = (s, prefix) => s.startsWith(prefix) ? s.slice(prefix.length) : null

const conceptView = (id, uri) => `/en/node/${id}?uri=${encodeURIComponent(uri)}#content`

// query uri at base
router.get("/", async (req, res, next) => {
  const { uri } = req.query
  if (!uri) {
    next()
  } else {

    // BARTOC URI, URL or lookalike
    const bartocUri = uri.match('^https?://(www\.)?bartoc.org/(.*)')
    if (bartocUri) {
      const localPart = bartocUri[2]

      // known vocabularies with namespace at bartoc.org
      if (localPart.startsWith("en/Format/")) {
        res.redirect(conceptView("20000", `http://bartoc.org/${localPart}`))
      } else if (localPart.startsWith("language/")) {
        res.redirect(conceptView("20287", `http://bartoc.org/${localPart}`))
      } else {
        // TODO: add ILC as well
        // any other page
        res.redirect(`/${localPart}`)
      }

      return
    }

    // Vocabulary or concept stored in the backend
    const dataEndpoint = config.registry._api.api + "data"
    const jskos = await config.registry.axios.get(dataEndpoint, { params: { uri } })
      .then(res => res[0])
      .catch(() => null)
    if (jskos) {
      const type = jskos.type[0]
      if (type === "http://www.w3.org/2004/02/skos/core#ConceptScheme") {
        // known vocabulary
        const id = suffix(jskos.uri, "http://bartoc.org/en/node/")
        if (id) {
          res.redirect(`/en/node/${id}`)
          return
        }
      } else if (type === "http://www.w3.org/2004/02/skos/core#Concept") {
        // known concept
        console.log(jskos.inScheme)
        const schemes = jskos.inScheme
          .map(s => suffix(s.uri, "http://bartoc.org/en/node/"))
          .filter(Boolean)
        if (schemes.length) {
          res.redirect(conceptView(schemes[0], concept))
          return
        }
      }
    }

    // TODO: try to match to a known vocabulary namespace
    // e.g. http://bartoc.org/api-type/jskos

    next()
  }
})

export default router
