import { spawnSync } from "node:child_process"
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { validateItem } from "../../src/validation.js"

const script = fileURLToPath(new URL("../../bin/reports.js", import.meta.url))
const baseType = "http://www.w3.org/2004/02/skos/core#ConceptScheme"

function record(id, title) {
  return {
    uri: `http://bartoc.org/en/node/${id}`,
    prefLabel: { en: title },
    definition: { en: ["English abstract"] },
    type: [baseType, "http://example.org/type#Thesaurus"],
  }
}

describe("quality reports", () => {
  it("returns validation errors and quality warnings for one record", () => {
    const item = {
      ...record(101, "Example"),
      versionOf: [{ uri: "http://bartoc.org/en/node/101" }],
      API: [{ url: "bad-url" }],
    }

    expect(validateItem(item)).toEqual([
      {
        message: "A vocabulary cannot be an edition of itself.",
        position: { jsonpointer: "/versionOf" },
      },
      {
        message: "Enter a complete URL starting with http:// or https://.",
        position: { jsonpointer: "/API/0/url" },
      },
    ])
    /* TODO: test quality checks
    expect(qualityWarnings(item)).toContainEqual({
      types: ["no-license"],
      level: "warning",
      message: "Missing license",
      position: { jsonpointer: "/license" },
    })
    */
  })

  it("writes validation errors and warning counts from an NDJSON file", () => {
    const directory = mkdtempSync(join(tmpdir(), "bartoc-quality-"))
    try {
      const good = { ...record(102, "Good, title"), extent: "10" }
      const bad = {
        ...record(103, "Bad"),
        versionOf: [{ uri: "http://bartoc.org/en/node/103" }],
      }
      const input = join(directory, "items.ndjson")
      writeFileSync(input, `${[good, bad].map(JSON.stringify).join("\n")}\n`)

      const result = spawnSync(process.execPath, [script, input], {
        cwd: directory,
        encoding: "utf8",
      })
      expect(result.status, result.stderr).toBe(0)

      const reports = join(directory, "data/reports")
      const validation = JSON.parse(readFileSync(join(reports, "validation-errors.json")))
      const summary = JSON.parse(readFileSync(join(reports, "quality-stats.json")))
      const missingExtent = JSON.parse(readFileSync(join(reports, "no-extent.json")))

      expect(validation.errors).toEqual([{
        position: { id: "http://bartoc.org/en/node/103" },
        message: "Record http://bartoc.org/en/node/103 does not conform to validation constraints",
        errors: [ {
          message: "A vocabulary cannot be an edition of itself.",
          position: { jsonpointer: "/versionOf" },
        }],
      }])
      expect(missingExtent.errors.map(e => e.position.id)).toEqual([bad.uri])
      expect(summary).toMatchObject({
        records: 2,
        invalidRecords: 1,
        warnings: { "no-extent": 1, "no-kos-type": 0 },
      })
      expect(readFileSync(join(reports, "no-license.csv"), "utf8")).toContain("\"Good, title\"")
      expect(readFileSync(join(reports, "no-extent.csv"), "utf8")).toContain(JSON.stringify(bad.uri) + ",")
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
