import { describe, it, expect } from "vitest"
import { startJskosStack, importInternalVocs } from "../helpers/jskos-server-bootstrap.js"

describe("integration: mongo + jskos-server", () => {
  it("serves /status and /voc", async () => {
    const stack = await startJskosStack({ dataDir: "data" })

    try {
      // 1) sanity check: status
      {
        const res = await fetch(`${stack.baseUrl}/status`)
        expect(res.status).toBe(200)
        const body = await res.text()
        expect(body).toMatch(/ok|running|status/i)
      }

      // 2) import internal vocs
      await importInternalVocs(stack.jskos)

      // 3) check voc endpoint
      {
        const url = new URL(`${stack.baseUrl}/voc`)
        url.searchParams.set("limit", "1")

        const res = await fetch(url.toString())
        expect(res.status).toBe(200)

        const data = await res.json()
        // jskos-server returans an array of schemes
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThan(0)
        expect(data[0]).toHaveProperty("uri")
      }
    } finally {
      await stack.stop()
    }
  }, 90_000)
})
