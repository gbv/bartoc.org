import { describe, expect, it } from "vitest"
import { isBartocUri, normalizeUri } from "../../src/uri.js"

describe("URI utilities", () => {
  it("normalizes editable string values", () => {
    expect(normalizeUri("  http://bartoc.org/en/node/123  ")).toBe(
      "http://bartoc.org/en/node/123",
    )
    expect(normalizeUri(null)).toBe("")
    expect(normalizeUri({})).toBe("")
  })

  it.each([
    ["a canonical BARTOC URI", "http://bartoc.org/en/node/123", true],
    ["an HTTPS URI", "https://bartoc.org/en/node/123", false],
    ["an external URI", "https://example.org/123", false],
    ["a URI with whitespace", " http://bartoc.org/en/node/123 ", false],
    ["a non-string value", null, false],
  ])("identifies %s", (_, value, expected) => {
    expect(isBartocUri(value)).toBe(expected)
  })
})
