import { describe, it, expect, vi } from "vitest"
import {
  buildSaveError,
  prepareItemForSave,
  saveVocabularyItem,
} from "../../vue/utils/itemEditorSave.js"
import { CONCEPT_SCHEME_TYPE } from "../../vue/utils/itemEditor.js"

function makeItem(overrides = {}) {
  return {
    uri: "http://bartoc.org/en/node/123",
    prefLabel: { en: ["Title"] },
    definition: { en: ["English abstract"] },
    type: [CONCEPT_SCHEME_TYPE],
    API: [
      { url: "https://example.org/api", type: "http://bartoc.org/api-type/jskos" },
      { url: "", type: "http://bartoc.org/api-type/webservice" },
    ],
    ...overrides,
  }
}

describe("ItemEditor save service", () => {
  it("prepares existing items as PUT requests with cleaned JSON", async () => {
    const fetchImpl = vi.fn()
    const trimItemIdentifiers = vi.fn()

    const result = await prepareItemForSave({
      item: makeItem(),
      fetchImpl,
      trimItemIdentifiers,
    })

    expect(fetchImpl).not.toHaveBeenCalled()
    expect(trimItemIdentifiers).toHaveBeenCalled()
    expect(result.method).toBe("PUT")
    expect(JSON.parse(result.body)).toMatchObject({
      uri: "http://bartoc.org/en/node/123",
      prefLabel: { en: ["Title"] },
      definition: { en: ["English abstract"] },
      API: [
        { type: "http://bartoc.org/api-type/jskos", url: "https://example.org/api" },
      ],
    })
  })

  it("prepares new items as POST requests with the next BARTOC URI", async () => {
    const fetchImpl = vi.fn(async () => ({
      json: async () => [{ uri: "http://bartoc.org/en/node/123" }],
    }))

    const result = await prepareItemForSave({
      item: makeItem({ uri: undefined }),
      fetchImpl,
      trimItemIdentifiers: vi.fn(),
    })

    expect(fetchImpl).toHaveBeenCalledWith("/api/voc?sort=counter&order=desc&limit=1")
    expect(result.method).toBe("POST")
    expect(result.item.uri).toBe("http://bartoc.org/en/node/124")
    expect(JSON.parse(result.body).uri).toBe("http://bartoc.org/en/node/124")
  })

  it("builds UI errors with a GitHub issue link", () => {
    const error = buildSaveError({
      error: { message: "Save failed" },
      response: { status: 500 },
      body: "{\n  \"uri\": \"x\"\n}",
      hasAuth: true,
    })

    expect(error.status).toBe(500)
    expect(error.message).toBe("Save failed")
    expect(error.html).toContain("https://github.com/gbv/bartoc.org/issues/new")
    expect(error.html).toContain("open a GitHub issue")
  })

  it("saves existing items with auth headers", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
    }))

    const result = await saveVocabularyItem({
      item: makeItem(),
      auth: { token: "token-123" },
      fetchImpl,
      trimItemIdentifiers: vi.fn(),
    })

    expect(result.ok).toBe(true)
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/voc",
      expect.objectContaining({
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-123",
        },
      }),
    )
  })

  it("returns a structured error when the API rejects the save", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ message: "Nope" }),
    }))

    const result = await saveVocabularyItem({
      item: makeItem(),
      fetchImpl,
      trimItemIdentifiers: vi.fn(),
    })

    expect(result.ok).toBe(false)
    expect(result.error).toMatchObject({
      status: 500,
      message: "Nope",
    })
  })

  it("returns a structured error when a new URI cannot be determined", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down")
    })

    const result = await saveVocabularyItem({
      item: makeItem({ uri: undefined }),
      fetchImpl,
      trimItemIdentifiers: vi.fn(),
    })

    expect(result.ok).toBe(false)
    expect(result.error).toMatchObject({
      status: "determining new URI",
      message: "Could not determine URI for new record.",
    })
  })

  it("does not hide unexpected payload preparation errors", async () => {
    await expect(saveVocabularyItem({
      item: makeItem(),
      fetchImpl: vi.fn(),
      cleanupItem: () => {
        throw new Error("cleanup exploded")
      },
      trimItemIdentifiers: vi.fn(),
    })).rejects.toThrow("cleanup exploded")
  })
})
