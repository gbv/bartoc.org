// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest"
import { flushPromises, mount } from "@vue/test-utils"
import RegistryList from "../../vue/components/RegistryList.vue"

const catalogType = "http://www.w3.org/ns/dcat#Catalog"
const fullRepositoryType = "http://bartoc.org/full-repository"
const registriesUrl = "/api/registries?limit=1000"

const metadataRegistryUri = "http://bartoc.org/en/node/1"
const terminologyServiceUri = "http://bartoc.org/en/node/2"
const terminologyRepositoryUri = "http://bartoc.org/en/node/3"

const metadataCountUrl = "/api/voc?partOf=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F1&limit=0"
const terminologyRepositoryCountUrl = "/api/voc?partOf=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F3&limit=0"
const metadataVocabulariesUrl = "/vocabularies?partOf=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F1"
const terminologyServiceVocabulariesUrl = "/vocabularies?partOf=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F2"
const terminologyRepositoryVocabulariesUrl = "/vocabularies?partOf=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F3"

function makeMetadataRegistry() {
  return {
    uri: metadataRegistryUri,
    prefLabel: { en: "Metadata Registry" },
    definition: {
      en: ["A metadata registry lists and describes terminologies for discovery."],
    },
    type: [catalogType],
    url: "https://metadata.example",
  }
}

function makeTerminologyService() {
  return {
    uri: terminologyServiceUri,
    prefLabel: { en: "Terminology Service" },
    definition: {
      en: ["A terminology service provides API access to terminologies."],
    },
    type: [catalogType, fullRepositoryType],
    url: "https://service.example",
    API: [
      {
        type: "http://bartoc.org/api-type/jskos",
        url: "https://service.example/api",
      },
    ],
    COUNT: 12,
  }
}

function makeTerminologyRepository() {
  return {
    uri: terminologyRepositoryUri,
    prefLabel: { en: "Terminology Repository" },
    definition: {
      en: ["A terminology repository contains full terminologies."],
    },
    type: [catalogType, fullRepositoryType],
    url: "https://repository.example",
  }
}

function makeRegistries() {
  return [
    makeMetadataRegistry(),
    makeTerminologyService(),
    makeTerminologyRepository(),
  ]
}

function countResponse(count) {
  return {
    headers: {
      get(name) {
        if (name !== "X-Total-Count" || count === undefined) {
          return null
        }

        return String(count)
      },
    },
  }
}

async function mountList(registries = makeRegistries(), counts = {}) {
  vi.stubGlobal("fetch", vi.fn(async url => {
    if (url === registriesUrl) {
      return {
        json: async () => registries,
      }
    }

    return countResponse(counts[url])
  }))

  const wrapper = mount(RegistryList)
  await flushPromises()
  return wrapper
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("RegistryList", () => {
  it("shows toggle buttons for registry functions", async () => {
    const wrapper = await mountList()

    expect(fetch).toHaveBeenCalledWith(registriesUrl)
    expect(wrapper.findAll("button").map(button => button.text())).toEqual([
      "Metadata Registries 1",
      "Terminology Services 1",
      "Terminology Repositories 1",
    ])
    expect(wrapper.findAll("button").map(button => button.attributes("title"))).toEqual([
      "List and describe terminologies.",
      "Provide access to terminologies via an API.",
      "Contain full terminologies.",
    ])
    expect(wrapper.findAll("button").map(button => button.attributes("aria-label"))).toEqual([
      "Metadata Registries: List and describe terminologies.",
      "Terminology Services: Provide access to terminologies via an API.",
      "Terminology Repositories: Contain full terminologies.",
    ])

    expect(wrapper.text()).toContain(
      "Registries can be filtered by function.",
    )
  })

  it("renders the compact registry table", async () => {
    const wrapper = await mountList()

    expect(wrapper.find("thead").findAll("th").map(th => th.text())).toEqual([
      "Name",
      "Function",
      "Description",
      "Terminologies in BARTOC",
      "API",
    ])

    expect(wrapper.get("a[href='/en/node/2']").text()).toBe(
      "Terminology Service",
    )
    expect(wrapper.get("a[href='https://service.example']").attributes("title")).toBe(
      "Homepage",
    )
    expect(
      wrapper.get(`a[href='${terminologyServiceVocabulariesUrl}']`).text(),
    ).toBe(
      "12",
    )
    expect(
      wrapper.get(`a[href='${terminologyServiceVocabulariesUrl}']`).attributes("aria-label"),
    ).toBe(
      "Show terminologies listed by Terminology Service",
    )
    expect(wrapper.get("a[href='https://service.example/api']").text()).toBe(
      "JSKOS API",
    )
    expect(wrapper.text()).toContain(
      "A terminology service provides API access to terminologies.",
    )
  })

  it("loads terminology counts for registries", async () => {
    const wrapper = await mountList(makeRegistries(), {
      [metadataCountUrl]: 4,
      [terminologyRepositoryCountUrl]: 0,
    })

    expect(fetch).toHaveBeenCalledWith(metadataCountUrl)
    expect(
      wrapper.get(`a[href='${metadataVocabulariesUrl}']`).text(),
    ).toBe(
      "4",
    )
    expect(
      wrapper.get(`a[href='${terminologyRepositoryVocabulariesUrl}']`).text(),
    ).toBe(
      "0",
    )
    expect(wrapper.find(".registry-count-loading").exists()).toBe(false)
  })

  it("shows a loading indicator while terminology counts load", async () => {
    const neverFinishedCountRequest = new Promise(() => {})

    vi.stubGlobal("fetch", vi.fn(async url => {
      if (url === registriesUrl) {
        return {
          json: async () => [makeMetadataRegistry()],
        }
      }

      return neverFinishedCountRequest
    }))

    const wrapper = mount(RegistryList)
    await flushPromises()

    expect(wrapper.get(".registry-count-loading").attributes("role")).toBe("status")
    expect(wrapper.get(".registry-count-loading").attributes("aria-label")).toBe(
      "Loading terminology count for Metadata Registry",
    )
    expect(wrapper.get(".registry-count-loading .jskos-vue-loadingIndicator").exists()).toBe(true)

    expect(fetch).toHaveBeenCalledWith(metadataCountUrl)
  })

  it("filters registries by function", async () => {
    const wrapper = await mountList()

    await wrapper.findAll("button")[1].trigger("click")

    const rows = wrapper.findAll("tbody tr").map(row => row.text())

    expect(rows.some(row => row.includes("Metadata Registry"))).toBe(true)
    expect(rows.some(row => row.includes("Terminology Service"))).toBe(false)
    expect(rows.some(row => row.includes("Terminology Repository"))).toBe(true)
  })

  it("shows an empty state", async () => {
    const wrapper = await mountList([])

    expect(wrapper.text()).toContain("No registries found.")
  })
})
