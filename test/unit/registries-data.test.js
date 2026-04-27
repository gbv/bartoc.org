// test/unit/registries-data.test.js
import { describe, it, expect, vi } from "vitest"

vi.mock("../../config/index.js", () => ({
  default: {
    backend: {
      api: "http://localhost:3000/",
    },
    log: vi.fn(),
    warn: vi.fn(),
  },
}))

import utils from "../../src/utils.js"

const rootDir = new URL("../../", import.meta.url).pathname
const file = "./data/registries.ndjson"

describe("registries.ndjson", () => {
  it("contains valid NDJSON", () => {
    expect(() => utils.readNdjson(rootDir, file)).not.toThrow()
  })

  it("contains registry records with required fields", () => {
    const records = utils.readNdjson(rootDir, file)

    records.forEach((record, index) => {
      expect(record.uri, `Missing uri at line ${index + 1}`).toBeTruthy()
      expect(record.prefLabel, `Missing prefLabel at line ${index + 1}`).toBeTruthy()
      expect(record.type, `Missing type at line ${index + 1}`).toBeTruthy()
    })
  })

  it("does not contain duplicate URIs", () => {
    const records = utils.readNdjson(rootDir, file)
    const seen = new Set()

    records.forEach((record, index) => {
      expect(
        seen.has(record.uri),
        `Duplicate URI at line ${index + 1}: ${record.uri}`,
      ).toBe(false)

      seen.add(record.uri)
    })
  })
})
