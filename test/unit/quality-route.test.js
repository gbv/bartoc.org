import express from "express"
import request from "supertest"
import { describe, expect, it, vi } from "vitest"
import createQualityRoute from "../../routes/quality.js"

function createApp() {
  const reports = {
    getSummaries: vi.fn(() => ({ "no-abstract": { totalErrors: 2 } })),
    getReport: vi.fn(id => id === "no-abstract" ? { id, errors: [] } : undefined),
    getErrors: vi.fn(() => [{ position: { id: "http://bartoc.org/en/node/14" } }]),
  }
  const app = express()
  app.use("/quality", createQualityRoute({ reports }))
  return { app, reports }
}

describe("quality route", () => {
  it("lists report summaries", async () => {
    const { app } = createApp()

    const response = await request(app)
      .get("/quality/reports")
      .expect(200)

    expect(response.body).toEqual({ "no-abstract": { totalErrors: 2 } })
  })

  it("returns a complete report", async () => {
    const { app, reports } = createApp()

    const response = await request(app)
      .get("/quality/reports/no-abstract.json")
      .expect(200)

    expect(response.body).toEqual({ id: "no-abstract", errors: [] })
    expect(reports.getReport).toHaveBeenCalledWith("no-abstract")
  })

  it("returns 404 for an unknown report", async () => {
    const { app } = createApp()

    await request(app)
      .get("/quality/reports/unknown.json")
      .expect(404, { error: "Report not found" })
  })

  it("finds errors by record URI", async () => {
    const { app, reports } = createApp()
    const id = "http://bartoc.org/en/node/14"

    await request(app)
      .get("/quality/errors")
      .query({ position: `id:${id}` })
      .expect(200)

    expect(reports.getErrors).toHaveBeenCalledWith({ id })
  })

  it("rejects a missing or invalid position", async () => {
    const { app } = createApp()
    const error = { error: "Expected position=id:<URI>" }

    await request(app)
      .get("/quality/errors")
      .expect(400, error)
    await request(app)
      .get("/quality/errors")
      .query({ position: "jsonpointer:/extent" })
      .expect(400, error)
  })
})
