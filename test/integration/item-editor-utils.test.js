import { describe, it, expect } from "vitest"
import {
  CONCEPT_SCHEME_TYPE,
  cleanupItem,
  conceptPickerModel,
  githubIssueUrl,
  itemError,
  normalizeEditableItem,
  parseNotationExamples,
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
