import express from "express"
import request from "supertest"
import { describe, expect, it, vi } from "vitest"
import createSparqlRoute from "../../routes/sparql.js"

const examples = [
  {
    label: "Example query",
    query: "ASK {}",
  },
]

function createApp(endpoint) {
  const app = express()
  const render = vi.fn((_req, res, view, locals) => {
    res.json({ view, locals })
  })

  app.use(createSparqlRoute({
    endpoint,
    examples,
    render,
  }))
  app.use((_req, res) => {
    res.sendStatus(404)
  })

  return { app, render }
}

describe("SPARQL route", () => {
  it("renders the query page when an endpoint is configured", async () => {
    const { app, render } = createApp("https://example.org/sparql")
    const response = await request(app)
      .get("/graph/")
      .expect(200)

    expect(response.body).toMatchObject({
      view: "vue-page",
      locals: {
        vuePage: "sparql",
        vuePageProps: {
          endpoint: "https://example.org/sparql",
          examples,
        },
        stylesheets: [
          "/vendor/yasgui/yasgui.min.css",
          "/vendor/fontawesome/css/all.min.css",
        ],
        scripts: ["/vendor/yasgui/yasgui.min.js"],
      },
    })
    expect(render).toHaveBeenCalledOnce()
  })

  it.each(["/graph", "/sparql", "/sparql/"])(
    "redirects %s permanently to the canonical URL",
    async (path) => {
      const { app, render } = createApp("https://example.org/sparql")

      await request(app)
        .get(path)
        .expect(301)
        .expect("Location", "/graph/")

      expect(render).not.toHaveBeenCalled()
    },
  )

  it("preserves the query string when redirecting", async () => {
    const { app } = createApp("https://example.org/sparql")

    await request(app)
      .get("/sparql?query=ASK%20%7B%7D")
      .expect(301)
      .expect("Location", "/graph/?query=ASK%20%7B%7D")
  })

  it("does not register the query page when the endpoint is disabled", async () => {
    const { app, render } = createApp(null)

    await request(app)
      .get("/graph/")
      .expect(404)

    expect(render).not.toHaveBeenCalled()
  })
})
