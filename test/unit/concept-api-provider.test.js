// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { createConceptApiProvider } from "../../vue/utils.js"

describe("Concept API provider", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns API suggestions", async () => {
    const suggestions = [
      "thes",
      ["Thesaurus"],
      [""],
      ["http://w3id.org/nkos/nkostype#thesaurus"],
    ]
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => suggestions,
    })))

    const provider = createConceptApiProvider({
      schemeUri: "http://w3id.org/nkos/nkostype",
      topUrl: "/api/voc/top",
      conceptsUrl: "/api/concepts",
      suggestUrl: "/api/concepts/suggest",
    })

    await expect(provider.search("thes")).resolves.toEqual(suggestions)
  })
})
