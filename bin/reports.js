#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs"
import { qualityChecks } from "../src/quality.js"
import { validateItem } from "../src/validation.js"
import { ErrorReport, ReportsDirectory } from "../src/dvrf.js"

/*
 * Create reports from an NDJSON dump: one vocabulary record on each line.
 * Pass the dump file as the first argument, or use the latest dump.
 */
const dump = process.argv[2] || "data/dumps/latest.ndjson"
const reportsDir = new ReportsDirectory("data/reports")

const items = readFileSync(dump, "utf8").split("\n").filter(Boolean).map(JSON.parse)
const rules = Object.fromEntries(qualityChecks.map(rule => [rule.id, rule]))

const reports = Object.fromEntries(
  qualityChecks.map(rule => [
    rule.id,
    new ErrorReport({
      title: rule.title,
      description: rule.description,
      types: [rule.id],
      level: "warning",
      errors: [],
      skipped: [],
    }),
  ]))

reports["validation-errors"] = new ErrorReport({
  title: "Validation errors",
  description: "BARTOC records not passing mandatory integrity and quality constraints",
  errors: [],
  skipped: [],
})

const summaryReport = new ErrorReport({
  title: "BARTOC full quality report",
  description: "Errors and warnings for each record",
  errors: [],
})

const itemData = {}
for (const item of items) {
  itemData[item.uri] = {
    prefLabel: item.prefLabel ?? null,
    modified: item.modified ?? null,
    type: item.type,
  }

  const itemContext = { position: { id: item.uri } }
  const errors = []

  for (const reportId in reports) {
    const report = reports[reportId]
    let defects = []
    if (reportId === "validation-errors") {
      const context = {
        position: { id: item.uri },
        message: `Record ${item.uri} does not conform to validation constraints`,
      }
      defects = report.checkFinding(item, validateItem, context)
    } else {
      const rule = rules[reportId]
      const validator = item => rule.fails(item) ? [{
        position: { jsonpointer: rule.jsonpointer },
      }] : []
      defects = report.checkFinding(item, validator, itemContext)
    }

    if (defects?.length) {
      errors.push(...defects.map(defect => ({ type: [reportId], ...defect })))
    }
  }

  summaryReport.checkFinding(item, () => errors, itemContext)
}

Object.entries(reports).forEach(([reportId, report]) => {
  reportsDir.writeReport(report, reportId)

  // CSV columns: URI, English rule.id, types, and modified date.
  const csv = report.errors.map(({ position }) => {
    const { prefLabel, type, modified } = itemData[position.id]
    return [
      position.id,
      prefLabel?.en,
      (type?.slice(1).map(uri => uri.replace(/.+#/, "")) ?? []).join("|"),
      modified,
    ].map(csvField).join(",")
  },
  )
  writeFileSync(
    `${reportsDir.path}/${reportId}.csv`,
    csv.length ? `${csv.join("\n")}\n` : "",
  )
})

reportsDir.writeReport(summaryReport, "summary")

// quote text values and leave missing values empty.
function csvField(value) {
  if (value == null) {
    return ""
  }
  if (typeof value === "string") {
    return "\"" + value.replaceAll("\"", "\"\"") + "\""
  }
  return JSON.stringify(value)
}
