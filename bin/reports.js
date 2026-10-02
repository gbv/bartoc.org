#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { qualityChecks } from "../src/quality.js"
import { validateItem } from "../src/validation.js"
import { ErrorReport } from "../src/dvrf.js"

/*
 * Create reports from an NDJSON dump: one vocabulary record on each line.
 * Pass the dump file as the first argument, or use the latest dump.
 */
const dump = process.argv[2] || "data/dumps/latest.ndjson"
const reportsDirectory = "data/reports"

const items = readFileSync(dump, "utf8").split("\n").filter(Boolean).map(JSON.parse)

mkdirSync(reportsDirectory, { recursive: true })

const warningCounts = {}

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

  writeJson(`${reportsDirectory}/${rule.id}.json`, report.finish())
  warningCounts[rule.id] = report.totalErrors

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
    `${reportsDirectory}/${rule.id}.csv`,
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

writeJson(`${reportsDirectory}/validation-errors.json`, report.finish())

// Summary of all reports
writeJson(`${reportsDirectory}/quality-stats.json`, {
  records: report.totalFindings,
  invalidRecords: report.totalErrors,
  warnings: warningCounts,
})

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

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
