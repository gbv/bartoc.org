import express from "express"

export default function createSparqlRoute({ endpoint, examples, render }) {
  const router = express.Router()

  if (endpoint) {
    router.get("/", (req, res) => {
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
