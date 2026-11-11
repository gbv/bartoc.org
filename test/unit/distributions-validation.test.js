import { describe, expect, it } from "vitest"
import { validateItem } from "../../src/validation.js"

const validItem = {
  prefLabel: { en: "Test Vocabulary" },
  definition: { en: ["Test definition"] },
}

describe("Distribution URL validation", () => {
  it("accepts valid and empty distribution URLs", () => {
    const errors = validateItem({
      ...validItem,
      distributions: [
        { download: "https://example.org/vocabulary.ttl" },
        { accessURL: "http://example.org/vocabulary" },
        { download: "", accessURL: "" },
      ],
    })

    expect(errors).toEqual([])
  })

  it("reports invalid distribution URLs with their JSON pointers", () => {
    const errors = validateItem({
      ...validItem,
      distributions: [
        { download: "not-a-valid-url" },
        { accessURL: "ftp://example.org/vocabulary" },
      ],
    })

    expect(errors).toEqual([
      {
        message: "Enter a complete download URL starting with http:// or https://.",
        position: {
          jsonpointer: "/distributions/0/download",
        },
      },
      {
        message: "Enter a complete publication URL starting with http:// or https://.",
        position: {
          jsonpointer: "/distributions/1/accessURL",
        },
      },
    ])
  })
})
