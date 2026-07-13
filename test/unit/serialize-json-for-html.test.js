import { describe, expect, it, vi } from "vitest"
import { serializeJsonForHtml } from "../../src/utils.js"

vi.mock("../../config/index.js", () => ({
  default: {
    backend: {
      api: "https://example.org/",
    },
  },
}))

describe("serializeJsonForHtml", () => {
  it("preserves JSON while escaping characters that are unsafe in HTML", () => {
    const value = {
      message: "</script><script>alert('xss')</script>&\u2028\u2029",
    }

    const serialized = serializeJsonForHtml(value)

    expect(serialized).not.toMatch(/[<>&\u2028\u2029]/)
    expect(JSON.parse(serialized)).toEqual(value)
  })
})
