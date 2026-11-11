import { describe, it, expect } from "vitest"
import { startJskosStack, importTestVocabulary } from "../helpers/jskos-server-bootstrap.js"

const schemeUri = "https://example.org/test/vocabulary"

describe("integration: mongo + jskos-server", () => {
  it("serves /status and /voc", async () => {
    const stack = await startJskosStack({ fixtureDir: "test/fixtures/jskos-stack" })

    try {
      // 1) sanity check: status
      {
        const res = await fetch(`${stack.baseUrl}/status`)
        expect(res.status).toBe(200)
        const body = await res.text()
        expect(body).toMatch(/ok|running|status/i)
      }

      // 2) import the test vocabulary
      await importTestVocabulary(stack.jskos)

      // 3) check voc endpoint
      {
        const url = new URL(`${stack.baseUrl}/voc`)
        url.searchParams.set("uri", schemeUri)

        const res = await fetch(url.toString())
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data).toHaveLength(1)
        expect(data[0].uri).toBe(schemeUri)
      }
    } finally {
      await stack.stop()
    }
  }, 90_000)
})
