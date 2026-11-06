import express from "express"

// Create the read-only API backed by generated quality reports.
export default function createQualityRoute({ reports }) {
  const router = express.Router()

  // List metadata and available formats for every report.
  router.get("/reports", (req, res) => {
    res.json(reports.getSummaries())
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

    res.json(reports.getErrors({ id: value }))
  })

  return router
}
