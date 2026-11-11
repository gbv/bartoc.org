import express from "express"
import request from "supertest"
import { describe, expect, it, vi } from "vitest"
import createQualityRoute from "../../routes/quality.js"

function createApp() {
  const reports = {
    getSummaries: vi.fn(() => ({
      "no-abstract": { totalErrors: 2, formats: ["json", "csv"] },
    })),
    getReport: vi.fn(id => id === "no-abstract" ? { id, errors: [] } : undefined),
    getErrors: vi.fn(() => [{
      position: { id: "http://bartoc.org/en/node/14" },
      errors: [{ type: ["no-abstract"], position: { jsonpointer: "/definition" } }],
    }]),
    getStats: vi.fn(() => ({ reports: 2, recordsWithFindings: 1, findings: 2 })),
  }
  const app = express()
  app.use("/quality", createQualityRoute({ reports }))
  return { app, reports }
}

describe("quality route", () => {
  it("renders the human-readable API summary", async () => {
    const { app } = createApp()

    const response = await request(app)
      .get("/quality/")
      .expect("Content-Type", /html/)
      .expect(200)

    expect(response.text).toContain("BARTOC Quality API")
    expect(response.text).toContain("/quality/openapi.json")
    expect(response.text).toContain("/quality/reports/{id}.json")
    expect(response.text).toContain(
      "position=id%3Ahttp%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F14\"><code>/quality/errors</code></a><code>?position=id:&#60;BARTOC_URI&#62;</code>",
    )
  })

  it("returns the OpenAPI description", async () => {
    const { app } = createApp()

    const response = await request(app)
      .get("/quality/openapi.json")
      .expect(200)

    expect(response.body.openapi).toBe("3.1.0")
    expect(Object.keys(response.body.paths)).toEqual([
      "/openapi.json",
      "/reports",
      "/reports/{id}.json",
      "/errors",
      "/stats",
    ])
    expect(response.body.components.schemas.ReportSummary.properties).toHaveProperty("_formats")
    expect(response.body.components.schemas.ReportSummary.properties).not.toHaveProperty("formats")
  })

  it("lists report summaries", async () => {
    const { app } = createApp()

    const response = await request(app)
      .get("/quality/reports")
      .expect(200)

    expect(response.body).toEqual({
      "no-abstract": { totalErrors: 2, _formats: ["json", "csv"] },
    })
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

    const response = await request(app)
      .get("/quality/errors")
      .query({ position: `id:${id}` })
      .expect(200)

    expect(response.body).toEqual([{
      type: ["no-abstract"],
      position: { jsonpointer: "/definition" },
    }])
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

  it("returns aggregate quality statistics", async () => {
    const { app } = createApp()

    await request(app)
      .get("/quality/stats")
      .expect(200, { reports: 2, recordsWithFindings: 1, findings: 2 })
  })
})
