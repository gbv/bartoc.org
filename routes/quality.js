import express from "express"
import { qualityOpenApi, renderQualityApiPage } from "../src/qualityApi.js"

// Create the read-only API backed by generated quality reports.
export default function createQualityRoute({ reports }) {
  const router = express.Router()

  // Show a human-readable summary generated from the OpenAPI description.
  router.get("/", (req, res) => {
    res.type("html").send(renderQualityApiPage())
  })

  // Publish the machine-readable contract used by the documentation page.
  router.get("/openapi.json", (req, res) => {
    res.json(qualityOpenApi)
  })

  // List metadata and available formats for every report.
  router.get("/reports", (req, res) => {
    const summaries = Object.fromEntries(
      Object.entries(reports.getSummaries()).map(([id, summary]) => {
        const { formats, ...metadata } = summary
        return [id, { ...metadata, _formats: formats }]
      }),
    )
    res.json(summaries)
  })

  // Return one complete report including its findings.
  router.get("/reports/:id.json", (req, res) => {
    const report = reports.getReport(req.params.id)
    if (!report) {
      return res.status(404).json({ error: "Report not found" })
    }
    res.json(report)
  })

  // Find quality findings for one BARTOC record URI.
  router.get("/errors", (req, res) => {
    const position = req.query.position
    if (typeof position !== "string") {
      return res.status(400).json({ error: "Expected position=id:<URI>" })
    }

    const separator = position.indexOf(":")
    const field = position.slice(0, separator)
    const value = position.slice(separator + 1)
    if (field !== "id" || !value) {
      return res.status(400).json({ error: "Expected position=id:<URI>" })
    }

    const records = reports.getErrors({ id: value })
    res.json(records.flatMap(record => record.errors || []))
  })

  // Return aggregate quality counts and report freshness.
  router.get("/stats", (req, res) => {
    res.json(reports.getStats())
  })

  return router
}
