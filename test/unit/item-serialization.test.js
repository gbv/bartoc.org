import { describe, expect, it } from "vitest"
import { canonicalItemCopy } from "../../src/itemSerialization.js"
import { rdfResponseContentType, rdfSerialize } from "../../src/rdf.js"

const context = "https://gbv.github.io/jskos/context.json"

function storedItem() {
  return {
    uri: "http://bartoc.org/en/node/294",
    prefLabel: { en: "Stored version" },
    type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
    versionOf: [{ uri: "http://bartoc.org/en/node/21133" }],
    _versionOfBacklink: [{ uri: "http://bartoc.org/en/node/999" }],
  }
}

describe("canonical item serialization", () => {
  it("uses plain text only for an inline N-Triples preview", () => {
    expect(rdfResponseContentType("nt")).toBe("application/n-triples")
    expect(rdfResponseContentType("nt", true)).toBe("text/plain")
    expect(rdfResponseContentType("rdfxml", true)).toBe("application/rdf+xml")
  })

  it("copies raw relations and removes computed presentation fields", () => {
    const stored = storedItem()

    const serialized = canonicalItemCopy(stored, context)

    expect(serialized).toEqual({
      uri: stored.uri,
      prefLabel: { en: "Stored version" },
      type: stored.type,
      versionOf: [{ uri: "http://bartoc.org/en/node/21133" }],
      "@context": context,
    })
    expect(serialized).not.toBe(stored)
    expect(serialized.versionOf).not.toBe(stored.versionOf)
    expect(stored).toHaveProperty("_versionOfBacklink")
    expect(stored).not.toHaveProperty("@context")
  })

  it("does not mutate stored data during RDF serialization", async () => {
    const stored = storedItem()
    const original = structuredClone(stored)

    await rdfSerialize(stored, "nt")

    expect(stored).toEqual(original)
  })

  it("includes the stored item in RDF/XML serialization", async () => {
    const xml = await rdfSerialize(storedItem(), "rdfxml")

    expect(xml).toContain("<skos:ConceptScheme rdf:about=\"http://bartoc.org/en/node/294\">")
    expect(xml).toContain("Stored version")
    expect(xml).toContain("http://bartoc.org/en/node/21133")
  })
})
