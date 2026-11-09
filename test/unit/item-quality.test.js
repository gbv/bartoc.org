import { describe, expect, it } from "vitest"
import { getLiveItemFindings, mergeItemFindings } from "../../src/itemQuality.js"

const conceptScheme = "http://www.w3.org/2004/02/skos/core#ConceptScheme"

function validItem(overrides = {}) {
  return {
    uri: "http://bartoc.org/en/node/123",
    prefLabel: { en: "Test vocabulary" },
    definition: { en: ["English abstract"] },
    type: [conceptScheme, "http://w3id.org/nkos/nkostype#thesaurus"],
    extent: "100 concepts",
    license: [{ uri: "https://example.org/license" }],
    url: "https://example.org/vocabulary",
    publisher: [{
      uri: "https://example.org/publisher",
      prefLabel: { en: "Example publisher" },
    }],
    subject: [{ uri: "http://bartoc.org/en/node/1" }],
    FORMAT: [{ uri: "http://bartoc.org/en/Format/json" }],
    languages: ["en"],
    notationExamples: ["EXAMPLE"],
    ...overrides,
  }
}

describe("item quality findings", () => {
  it("marks live quality checks as warnings and validation findings as errors", () => {
    const findings = getLiveItemFindings(validItem({
      license: undefined,
      publisher: [{ uri: "invalid", prefLabel: { en: "Example publisher" } }],
    }))

    expect(findings.find(finding => finding.code === "no-license")).toMatchObject({
      level: "warning",
      status: "issue",
    })
    expect(findings.find(finding => finding.code === "validation-errors")).toMatchObject({
      level: "error",
      status: "issue",
      messages: ["Publisher URI must be a valid HTTP(S) URL!"],
    })
  })

  it("marks snapshot-only findings as fixed without changing live issues", () => {
    const live = getLiveItemFindings(validItem({ license: undefined }))
    const findings = mergeItemFindings([
      { type: ["no-license"] },
      { type: ["no-format"] },
      { type: ["validation-errors"] },
    ], live)

    expect(findings.find(finding => finding.code === "no-license")).toMatchObject({
      level: "warning",
      status: "issue",
    })
    expect(findings.find(finding => finding.code === "no-format")).toMatchObject({
      level: "warning",
      status: "fixed",
    })
    expect(findings.find(finding => finding.code === "validation-errors")).toMatchObject({
      level: "error",
      status: "fixed",
    })
  })
})
