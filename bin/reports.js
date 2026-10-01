#!/usr/bin/env node
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "node:fs"
import { createInterface } from "node:readline"
import { qualityChecks, qualityWarning } from "../src/quality.js"
import { validateItem } from "../src/validation.js"

/*
 * Create reports from an NDJSON dump: one vocabulary record on each line.
 * Pass the dump file as the first argument, or use the latest dump.
 */
const dump = process.argv[2] || "data/dumps/latest.ndjson"
const reportsDirectory = "data/reports"

try {
  if (!existsSync(dump)) {
    throw new Error(`Missing file: ${dump}`)
  }
  mkdirSync(reportsDirectory, { recursive: true })

  const warningCounts = {}

  // Read the dump once for each quality report.
  // This keeps one report in memory.
  for (const ruleId of qualityChecks.map(rule => rule.id)) {
    const schemes = []
    for await (const item of readItems(dump)) {
      if (qualityWarning(item, ruleId)) {
        schemes.push(reportScheme(item))
      }
    }

    warningCounts[ruleId] = schemes.length
    writeJson(`${reportsDirectory}/${ruleId}.json`, {
      types: [ruleId],
      errors: schemes.map(s => ({ position: { id: s.uri } })),
    })

    // CSV columns: URI, English ruleId, types, and modified date.
    const csv = schemes.map(({ uri, prefLabel, modified, type }) => [
      uri,
      prefLabel?.en,
      type.join("|"),
      modified,
    ].map(csvField).join(","))
    writeFileSync(
      `${reportsDirectory}/${ruleId}.csv`,
      csv.length ? `${csv.join("\n")}\n` : "",
    )
  }

  // Read the dump again for validation errors and the total record count.
  const errors = []
  const skipped = []
  let totalFindings = 0
  for await (const item of readItems(dump)) {
    const locator = { dimension: "id", address: item.uri }
    totalFindings++
    try {
      const validationErrors = validateItem(item)
      if (validationErrors.length) {
        errors.push({ ...locator, errors: validationErrors })
      }
    } catch (error) {
      skipped.push(locator)
    }
  }

  const errorReport = {
    title: "Validation errors",
    description: "BARTOC records not passing mandatory integrity and quality constraints",
    errors,
    skipped,
    totalSkipped: skipped.length,
    totalErrors: errors.length,
    totalCompliances: totalFindings - errors.length - skipped.length,
    totalFindings,
  }
  writeJson(`${reportsDirectory}/validation-errors.json`, errorReport)

  // Summary of all reports
  writeJson(`${reportsDirectory}/quality-stats.json`, {
    records: errorReport.totalFindings,
    invalidRecords: errorReport.totalErrors,
    warnings: warningCounts,
  })
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}

// Read one JSON record from each non-empty line of the dump.
async function* readItems(file) {
  const input = createInterface({ input: createReadStream(file), crlfDelay: Infinity })
  let lineNumber = 0
  for await (const line of input) {
    lineNumber++
    if (!line.trim()) {
      continue
    }
    let item
    try {
      item = JSON.parse(line)
    } catch (error) {
      throw new Error(`${file}:${lineNumber}: ${error.message}`)
    }
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`${file}:${lineNumber}: expected a record object`)
    }
    yield item
  }
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

// Match jq @csv: quote text values and leave missing values empty.
function csvField(value) {
  if (value == null) {
    return ""
  }
  if (typeof value === "string") {
    return "\"" + value.replaceAll("\"", "\"\"") + "\""
  }
  return JSON.stringify(value)
}

// Omit the main JSKOS type and shorten the other type URIs.
function reportScheme({ uri, prefLabel, modified, type }) {
  return {
    uri: uri ?? null,
    prefLabel: prefLabel ?? null,
    modified: modified ?? null,
    type: Array.isArray(type) ? type.slice(1).map(value => String(value).replace(/.+#/, "")) : [],
  }
}
