import express from "express"

export default function createSparqlRoute({ endpoint, examples, render }) {
  const router = express.Router({ strict: true })

  if (endpoint) {
    router.get(["/graph", "/sparql", "/sparql/"], (req, res) => {
      const queryIndex = req.originalUrl.indexOf("?")
      const query = queryIndex === -1 ? "" : req.originalUrl.slice(queryIndex)
      res.redirect(301, `/graph/${query}`)
    })

    router.get("/graph/", (req, res) => {
      render(req, res, "vue-page", {
        title: "SPARQL Query",
        vuePage: "sparql",
        vuePageProps: {
          endpoint,
          examples,
        },
        stylesheets: [
          "/vendor/yasgui/yasgui.min.css",
          "/vendor/fontawesome/css/all.min.css",
        ],
        scripts: ["/vendor/yasgui/yasgui.min.js"],
      })
    })
  }

  return router
}
