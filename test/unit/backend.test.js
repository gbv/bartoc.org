import { describe, it, expect, vi } from "vitest"
import { getConceptsInBatches } from "../../src/backend.js"

describe("backend helpers", () => {
  it("loads concepts in batches", async () => {
    const concepts = Array.from({ length: 45 }, (_, index) => ({
      uri: `concept:${index + 1}`,
    }))
    const backend = {
      getConcepts: vi.fn(async ({ concepts }) =>
        concepts.map(concept => ({ ...concept, loaded: true })),
      ),
    }

    const found = await getConceptsInBatches(backend, concepts, 20)

    expect(backend.getConcepts).toHaveBeenCalledTimes(3)
    expect(backend.getConcepts.mock.calls.map(([call]) => call.concepts.length)).toEqual([
      20,
      20,
      5,
    ])
    expect(found).toHaveLength(45)
    expect(found[0]).toEqual({ uri: "concept:1", loaded: true })
    expect(found[44]).toEqual({ uri: "concept:45", loaded: true })
  })

  it("does not call the backend for an empty concept list", async () => {
    const backend = {
      getConcepts: vi.fn(),
    }

    const found = await getConceptsInBatches(backend, null)

    expect(found).toEqual([])
    expect(backend.getConcepts).not.toHaveBeenCalled()
  })
})
