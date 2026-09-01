import { describe, it, expect } from "vitest"
import {
  CONCEPT_SCHEME_TYPE,
  cleanupItem,
  conceptPickerModel,
  githubIssueUrl,
  itemError,
  normalizeEditableItem,
  parseNotationExamples,
  hasValidVersionOf,
} from "../../vue/utils/itemEditor.js"

describe("ItemEditor business logic", () => {
  it("normalizes missing object and array fields for editing", () => {
    const current = {
      prefLabel: { en: ["Title"] },
      notationExamples: ["A", "B"],
    }

    const item = normalizeEditableItem(current)

    expect(item).toBe(current)
    expect(item.prefLabel).toEqual({ en: ["Title"] })
    expect(item.altLabel).toEqual({})
    expect(item.definition).toEqual({})
    expect(item.ADDRESS).toEqual({})
    expect(item.DISPLAY).toEqual({})
    expect(item.notation).toEqual([])
    expect(item.identifier).toEqual([])
    expect(item.subjectOf).toEqual([])
    expect(item.versionOf).toEqual([])
    expect(item.basedOn).toEqual([])
  })

  it("parses notation examples from comma-separated input", () => {
    expect(parseNotationExamples(" A, B,, C , ")).toEqual(["A", "B", "C"])
  })

  it("converts selected concepts to uri-only picker model values", () => {
    expect(conceptPickerModel([
      { uri: "concept:a", prefLabel: { en: "A" } },
      { prefLabel: { en: "Missing URI" } },
      { uri: "concept:b" },
    ])).toEqual([
      { uri: "concept:a" },
      { uri: "concept:b" },
    ])
  })

  it("validates required title, English abstract and publisher", () => {
    expect(itemError({
      prefLabel: {},
      definition: { en: ["English abstract"] },
      publisher: [],
    })).toEqual({ message: "item must have at least a title!" })

    expect(itemError({
      prefLabel: { en: ["Title"] },
      definition: { en: ["   "] },
      publisher: [],
    })).toEqual({ message: "Please provide at least one English abstract." })

    expect(itemError({
      prefLabel: { en: ["Title"] },
      definition: { en: ["English abstract"] },
      publisher: [{ prefLabel: { en: "Publisher" }, uri: "not-a-url" }],
    })).toEqual({ message: "Publisher URI must be a valid HTTP(S) URL!" })

    expect(itemError({
      prefLabel: { en: ["Title"] },
      definition: { en: ["English abstract"] },
      publisher: [{ prefLabel: { en: "Publisher" }, uri: "https://example.org" }],
    })).toBeUndefined()
  })

  it("allows a version number and link instead of a title", () => {
    const item = {
      prefLabel: {},
      version: "3.0",
      versionOf: [{ uri: "http://bartoc.org/en/node/21133" }],
      definition: {},
      publisher: [],
    }
    const titleError = { message: "item must have at least a title!" }

    expect(itemError(item)).toBeUndefined()
    expect(itemError({ ...item, version: "" })).toEqual(titleError)
    expect(itemError({ ...item, versionOf: [] })).toEqual(titleError)
  })

  it("blocks self-references in terminology relations", () => {
    const uri = "http://bartoc.org/en/node/18410"
    const validItem = {
      uri,
      prefLabel: { en: ["Title"] },
      definition: { en: ["English abstract"] },
      publisher: [],
    }

    expect(itemError({
      ...validItem,
      versionOf: [{ uri }],
    })).toEqual({ message: "A vocabulary cannot be a version of itself." })

    expect(itemError({
      ...validItem,
      basedOn: [{ uri: ` ${uri} ` }],
    })).toEqual({ message: "A vocabulary cannot be based on itself." })

    expect(itemError({
      ...validItem,
      versionOf: [{ uri: "http://bartoc.org/en/node/21133" }],
      basedOn: [{ uri: "http://bartoc.org/en/node/17963" }],
    })).toBeUndefined()
  })

  it("allows a version record without an English abstract", () => {
    expect(itemError({
      prefLabel: { en: ["Version title"] },
      definition: {},
      versionOf: [{ uri: "http://bartoc.org/en/node/21133" }],
      publisher: [],
    })).toBeUndefined()
  })

  it.each([
    ["an empty relation", []],
    ["an empty URI", [{ uri: "" }]],
    ["a non-BARTOC URI", [{ uri: "https://example.org/terminology/base" }]],
    ["multiple references", [
      { uri: "http://bartoc.org/en/node/21133" },
      { uri: "http://bartoc.org/en/node/20827" },
    ]],
  ])("does not let %s bypass the English abstract requirement", (_, versionOf) => {
    expect(itemError({
      prefLabel: { en: ["Version title"] },
      definition: {},
      versionOf,
      publisher: [],
    })).toEqual({ message: "Please provide at least one English abstract." })
  })

  it("reports a versionOf self-reference before a missing abstract", () => {
    const uri = "http://bartoc.org/en/node/18410"

    expect(itemError({
      uri,
      prefLabel: { en: ["Version title"] },
      definition: {},
      versionOf: [{ uri }],
      publisher: [],
    })).toEqual({ message: "A vocabulary cannot be a version of itself." })
  })

  it("cleans empty fields and normalizes relation-like values", () => {
    const cleaned = cleanupItem({
      type: [],
      API: [
        { url: "", type: "http://bartoc.org/api-type/webservice" },
        { url: "https://example.org/api", type: "http://bartoc.org/api-type/jskos" },
      ],
      subject: [
        {
          uri: "subject:1",
          inScheme: [{ uri: "scheme:1", prefLabel: { en: "Scheme" } }],
          notation: ["1"],
          prefLabel: { en: "Subject" },
        },
      ],
      definition: {
        en: ["English abstract"],
        de: ["Deutsch Abstract"],
        "": ["remove me"],
      },
      versionOf: [
        { uri: "" },
        { uri: "vocabulary:previous", prefLabel: { en: "Previous" } },
      ],
      basedOn: [
        { uri: "vocabulary:base", prefLabel: { en: "Base" } },
      ],
      _private: "hidden",
    })

    expect(cleaned).toEqual({
      type: [CONCEPT_SCHEME_TYPE],
      API: [
        { type: "http://bartoc.org/api-type/jskos", url: "https://example.org/api" },
      ],
      subject: [
        {
          uri: "subject:1",
          inScheme: [{ uri: "scheme:1" }],
          notation: ["1"],
        },
      ],
      definition: {
        en: ["English abstract"],
        de: ["Deutsch Abstract"],
      },
      versionOf: [
        { uri: "vocabulary:previous" },
      ],
      basedOn: [
        { uri: "vocabulary:base" },
      ],
    })
  })

  it("builds encoded GitHub issue URLs", () => {
    const url = new URL(githubIssueUrl("Error 500 when saving", "body with spaces"))

    expect(url.origin + url.pathname).toBe("https://github.com/gbv/bartoc.org/issues/new")
    expect(url.searchParams.get("title")).toBe("Error 500 when saving")
    expect(url.searchParams.get("body")).toBe("body with spaces")
  })
})

describe("hasValidVersionOf", () => {
  const itemUri = "http://bartoc.org/en/node/18410"
  const baseUri = "http://bartoc.org/en/node/21133"

  it("accepts exactly one BARTOC reference", () => {
    expect(hasValidVersionOf({
      uri: itemUri,
      versionOf: [{ uri: baseUri }],
    })).toBe(true)

    expect(hasValidVersionOf({
      uri: itemUri,
      versionOf: [{ uri: ` ${baseUri} ` }],
    })).toBe(true)
  })

  it("rejects a missing or empty reference", () => {
    expect(hasValidVersionOf({})).toBe(false)
    expect(hasValidVersionOf({ versionOf: null })).toBe(false)
    expect(hasValidVersionOf({ versionOf: [] })).toBe(false)
    expect(hasValidVersionOf({ versionOf: [{}] })).toBe(false)
    expect(hasValidVersionOf({ versionOf: [{ uri: "   " }] })).toBe(false)
  })

  it("rejects a non-BARTOC reference", () => {
    expect(hasValidVersionOf({
      uri: itemUri,
      versionOf: [{ uri: "https://example.org/terminology/base" }],
    })).toBe(false)
  })

  it("rejects multiple references", () => {
    expect(hasValidVersionOf({
      uri: itemUri,
      versionOf: [
        { uri: baseUri },
        { uri: "http://bartoc.org/en/node/20827" },
      ],
    })).toBe(false)
  })

  it("rejects a self-reference", () => {
    expect(hasValidVersionOf({
      uri: ` ${itemUri} `,
      versionOf: [{ uri: itemUri }],
    })).toBe(false)
  })
})
