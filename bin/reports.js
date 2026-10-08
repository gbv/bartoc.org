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
const reports = new ReportsDirectory("data/reports")

const items = readFileSync(dump, "utf8").split("\n").filter(Boolean).map(JSON.parse)

for (const rule of qualityChecks) {
  const report = new ErrorReport({
    title: rule.title,
    description: rule.description,
    types: [rule.id],
    level: "warning",
    errors: [],
    skipped: [],
  })

  const itemData = {}
  for (const item of items) {
    itemData[item.uri] = {
      prefLabel: item.prefLabel ?? null,
      modified: item.modified ?? null,
      type: item.type,
    }
    const validator = item => rule.fails(item) ? [{
      position: { jsonpointer: rule.jsonpointer },
    }] : []
    const context = { position: { id: item.uri } }
    report.checkFinding(item, validator, context)
  }

  reports.writeReport(report, rule.id)

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
    `${reports.path}/${rule.id}.csv`,
    csv.length ? `${csv.join("\n")}\n` : "",
  )
}

// Generate validation report
const report = new ErrorReport({
  title: "Validation errors",
  description: "BARTOC records not passing mandatory integrity and quality constraints",
  errors: [],
  skipped: [],
})

for (const item of items) {
  const context = {
    position: { id: item.uri },
    message: `Record ${item.uri} does not conform to validation constraints`,
  }
  report.checkFinding(item, validateItem, context)
}

reports.writeReport(report, "validation-errors")

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
