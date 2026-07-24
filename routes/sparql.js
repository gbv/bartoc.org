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
          "/vendor/yasqe/yasqe.min.css",
          "/vendor/yasr/yasr.min.css",
        ],
      })
    })
  }

  return router
}
