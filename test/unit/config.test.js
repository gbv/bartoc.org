import { describe, expect, it } from "vitest"
import configDefault from "../../config/config.default.json"
import {
  normalizeSparqlExamples,
  validateSparqlEndpoint,
} from "../../config/utils.js"

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

describe("SPARQL example configuration", () => {
  it("provides normalized default examples", () => {
    const examples = normalizeSparqlExamples(configDefault.sparqlExamples)

    expect(examples).toHaveLength(9)
    expect(examples.some(({ label }) => label.includes("(Geo)"))).toBe(false)
    expect(examples[0].query).toContain("GRAPH ?g")
    expect(examples.map(({ label }) => label)).toEqual(expect.arrayContaining([
      "Describe a BK concept (Graph)",
      "Basic Classification metadata (Graph)",
      "Terminologies about historical geography (Graph)",
      "Terminologies by decade of creation",
    ]))
  })

  it("normalizes labels and queries", () => {
    expect(normalizeSparqlExamples([
      {
        label: " Example query ",
        query: " ASK {} \n",
      },
    ])).toEqual([
      {
        label: "Example query",
        query: "ASK {}",
      },
    ])
  })

  it("accepts an empty list to disable examples", () => {
    expect(normalizeSparqlExamples([])).toEqual([])
  })

  it.each([
    null,
    {},
    [null],
    [[]],
    [{ label: "", query: "ASK {}" }],
    [{ label: "Example", query: " " }],
  ])("rejects invalid examples: %j", examples => {
    expect(() => normalizeSparqlExamples(examples)).toThrow(
      "Invalid \"sparqlExamples\" configuration",
    )
  })
})
