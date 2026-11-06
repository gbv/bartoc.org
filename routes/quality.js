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

  return router
}
