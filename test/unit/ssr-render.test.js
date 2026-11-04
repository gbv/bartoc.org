import { describe, expect, it } from "vitest"
import { renderVuePage } from "../../vue/entry-server.js"

describe("Vue SSR in Node", () => {
  it("renders a page without browser globals when no active path is supplied", async () => {
    const html = await renderVuePage({ page: "about" })
    expect(html).toContain("Basic Register of Thesauri")
  })
})
