import { describe, it, expect, vi } from "vitest"

vi.mock("../../config/index.js", () => ({
  default: {
    registry: {
      getSchemes: vi.fn(),
    },
  },
}))

import { parseFrontMatter } from "../../routes/page.js"

describe("page route helpers", () => {
  it("parses YAML front matter and returns the remaining markdown body", () => {
    const content = `---
title: About
featured: true
---

# About BARTOC
`

    const { attributes, body } = parseFrontMatter(content)

    expect(attributes).toEqual({
      title: "About",
      featured: true,
    })
    expect(body).toBe("\n# About BARTOC\n")
  })

  it("keeps markdown without front matter unchanged", () => {
    const content = "# Plain page\n\nNo metadata here.\n"

    const { attributes, body } = parseFrontMatter(content)

    expect(attributes).toEqual({})
    expect(body).toBe(content)
  })
})
