import { describe, it, expect } from "vitest"
import { trimItemIdentifiers } from "../../vue/utils"

describe("trimItemIdentifiers", () => {
  it("trims strings and removes empty entries", () => {
    const item = {
      url: "  https://example.org  ",
      identifier: ["  a  ", "   ", "b"],
      languages: [" en ", ""],
      subjectOf: [{ url: "  https://x  " }, { url: "   " }],
      partOf: [{ uri: "  http://r  " }, { uri: "   " }],
      API: [{ url: "  /api  ", type: "  t  " }, { url: "   ", type: "x" }],
      subject: [
        { uri: "  http://c  ", notation: [" 01 ", "  "], inScheme: [{ uri: "  http://s  " }, { uri: " " }] },
        { uri: "   ", inScheme: [{ uri: "http://s" }] },
      ],
    }

    const out = trimItemIdentifiers(item)

    expect(out.url).toBe("https://example.org")
    expect(out.identifier).toEqual(["a", "b"])
    expect(out.languages).toEqual(["en"])

    expect(out.subjectOf).toEqual([{ url: "https://x" }])
    expect(out.partOf).toEqual([{ uri: "http://r" }])

    expect(out.API).toEqual([{ url: "/api", type: "t" }])

    expect(out.subject).toEqual([
      { uri: "http://c", notation: ["01"], inScheme: [{ uri: "http://s" }] },
    ])
  })

  it("returns non-objects unchanged", () => {
    expect(trimItemIdentifiers(null)).toBe(null)
    expect(trimItemIdentifiers("x")).toBe("x")
  })
})
