import { describe, expect, it } from "vitest"
import { validateSparqlEndpoint } from "../../config/utils.js"

describe("SPARQL endpoint configuration", () => {
  it("accepts null to disable the endpoint", () => {
    expect(validateSparqlEndpoint(null)).toBeNull()
  })

  it("normalizes an absolute HTTP(S) URL", () => {
    expect(validateSparqlEndpoint(" https://example.org/sparql ")).toBe(
      "https://example.org/sparql",
    )
  })

  it.each([
    undefined,
    "",
    "sparql",
    "/sparql",
    "ftp://example.org/sparql",
    42,
  ])("rejects an invalid endpoint: %j", endpoint => {
    expect(() => validateSparqlEndpoint(endpoint)).toThrow(
      "Invalid \"sparql\" configuration",
    )
  })
})
