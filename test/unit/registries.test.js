// test/unit/registries.test.js
import { describe, it, expect, vi, afterEach } from "vitest"

// Mocking config here!
// This avoids running cdk.initializeRegistry(...) from the real config/index.js
// which seems to cause issues
vi.mock("../../config/index.js", () => ({
  default: {
    backend: {
      api: "http://localhost:3000/",
    },
    registry: {
      getSchemes: vi.fn(),
    },
    log: vi.fn(),
    warn: vi.fn(),
  },
}))

import {
  enrichRegistriesWithTerminologiesCounts,
  getRepositories,
  jskosDataUrl,
  loadRegistriesFromBackend,
  refreshRegistries,
  registriesApiUrl,
} from "../../src/registries.js"
import config from "../../config/index.js"

const registryOnly = {
  uri: "http://bartoc.org/en/node/1",
  prefLabel: { en: "Registry only" },
  type: ["http://www.w3.org/ns/dcat#Catalog"],
}

const fullRepository = {
  uri: "http://bartoc.org/en/node/2",
  prefLabel: { en: "Full repository" },
  type: [
    "http://www.w3.org/ns/dcat#Catalog",
    "http://bartoc.org/full-repository",
  ],
}

const registries = [registryOnly, fullRepository]
const registriesByUri = {
  [registryOnly.uri]: registryOnly,
  [fullRepository.uri]: fullRepository,
}

function mockFetch(data, ok = true) {
  const fetchMock = vi.fn(async () => ({
    ok,
    json: async () => data,
  }))
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function mockSchemeCounts(counts) {
  config.registry.getSchemes.mockImplementation(async ({ params }) => {
    const schemes = []
    schemes._totalCount = counts[params.partOf] ?? 0
    return schemes
  })
}

describe("registries", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
    vi.restoreAllMocks()
  })

  it("filters registries that are also repositories or services", () => {
    const repositories = getRepositories(registriesByUri)

    expect(repositories).toEqual({
      [fullRepository.uri]: fullRepository,
    })
  })

  it("loads all registries from backend and indexes them by URI", async () => {
    const fetchMock = mockFetch(registries)

    const loaded = await loadRegistriesFromBackend()

    expect(loaded).toEqual(registriesByUri)
    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      "http://localhost:3000/registries?limit=10000",
    )
  })

  it("throws an error if backend loading fails", async () => {
    mockFetch([], false)

    await expect(loadRegistriesFromBackend()).rejects.toThrow(
      "Could not load registries",
    )
  })

  it("refreshes registries without loading terminology counts", async () => {
    mockFetch(registries)

    const refreshed = await refreshRegistries()

    expect(refreshed.source).toBe("backend")
    expect(refreshed.registries).toEqual(registriesByUri)
    expect(config.registry.getSchemes).not.toHaveBeenCalled()
  })

  it("adds terminology counts to registry records", async () => {
    mockSchemeCounts({
      [registryOnly.uri]: 2,
    })

    const records = {
      [registryOnly.uri]: { ...registryOnly },
      [fullRepository.uri]: { ...fullRepository },
    }

    await enrichRegistriesWithTerminologiesCounts(records)

    expect(records[registryOnly.uri].terminologiesCount).toBe(2)
    expect(records[fullRepository.uri].terminologiesCount).toBe(0)
    expect(config.registry.getSchemes).toHaveBeenCalledTimes(2)
  })

  it("builds the registries API download URL", () => {
    expect(registriesApiUrl()).toBe("/api/registries?limit=10000")
  })

  it("builds an encoded JSKOS data URL", () => {
    expect(jskosDataUrl("http://bartoc.org/en/node/18926")).toBe(
      "/api/data?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F18926",
    )
  })
})
