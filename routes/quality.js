import express from "express"

// Create the read-only API backed by generated quality reports.
export default function createQualityRoute({ reports }) {
  const router = express.Router()

  // List metadata and available formats for every report.
  router.get("/reports", (req, res) => {
    res.json(reports.getSummaries())
  })

  return router
}
