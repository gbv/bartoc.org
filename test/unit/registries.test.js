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
    log: vi.fn(),
    warn: vi.fn(),
  },
}))

import {
  getRepositories,
  jskosDataUrl,
  loadRegistriesFromBackend,
  registriesApiUrl,
} from "../../src/registries.js"

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

function response(data, ok = true) {
  return {
    ok,
    json: async () => data,
  }
}

describe("registries", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("filters registries that are also repositories or services", () => {
    const registries = {
      [registryOnly.uri]: registryOnly,
      [fullRepository.uri]: fullRepository,
    }

    const repositories = getRepositories(registries)

    expect(repositories).toEqual({
      [fullRepository.uri]: fullRepository,
    })
  })

  it("loads registries from backend and indexes them by URI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response([registryOnly, fullRepository])),
    )

    const registries = await loadRegistriesFromBackend()

    expect(registries).toEqual({
      [registryOnly.uri]: registryOnly,
      [fullRepository.uri]: fullRepository,
    })
  })

  it("requests all registries with an explicit limit", async () => {
    const fetchMock = vi.fn(async () => response([]))
    vi.stubGlobal("fetch", fetchMock)

    await loadRegistriesFromBackend()

    const url = fetchMock.mock.calls[0][0]

    expect(url.toString()).toBe(
      "http://localhost:3000/registries?limit=10000",
    )
  })

  it("throws an error if backend loading fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response([], false)),
    )

    await expect(loadRegistriesFromBackend()).rejects.toThrow(
      "Could not load registries",
    )
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
