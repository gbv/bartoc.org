#!/usr/bin/env node
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "node:fs"
import { createInterface } from "node:readline"
import { qualityReportNames, qualityWarning } from "../src/quality.js"
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
  for (const title of qualityReportNames()) {
    const schemes = []
    for await (const item of readItems(dump)) {
      if (qualityWarning(item, title)) {
        schemes.push(reportScheme(item))
      }
    }

    warningCounts[title] = schemes.length
    writeJson(`${reportsDirectory}/${title}.json`, { title, schemes })

    // CSV columns: URI, English title, types, and modified date.
    const csv = schemes.map(({ uri, prefLabel, modified, type }) => [
      uri,
      prefLabel?.en,
      type.join("|"),
      modified,
    ].map(csvField).join(","))
    writeFileSync(
      `${reportsDirectory}/${title}.csv`,
      csv.length ? `${csv.join("\n")}\n` : "",
    )
  }

  // Read the dump again for validation errors and the total record count.
  // Quality warnings were counted above.
  const invalidRecords = []
  let recordCount = 0
  let errorCount = 0
  for await (const item of readItems(dump)) {
    recordCount++
    let errors
    try {
      errors = validateItem(item)
    } catch (error) {
      // A bad field type may make a validator fail. Keep that record visible.
      errors = [{ message: `Validation could not run: ${error.message}` }]
    }
    if (errors.length) {
      invalidRecords.push({ uri: item.uri, prefLabel: item.prefLabel, errors })
      errorCount += errors.length
    }
  }

  writeJson(`${reportsDirectory}/validation-errors.json`, {
    title: "validation-errors",
    schemes: invalidRecords,
  })
  writeJson(`${reportsDirectory}/quality-stats.json`, {
    records: recordCount,
    invalidRecords: invalidRecords.length,
    validationErrors: errorCount,
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
