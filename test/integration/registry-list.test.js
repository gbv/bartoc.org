// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest"
import { flushPromises, mount } from "@vue/test-utils"
import RegistryList from "../../vue/components/RegistryList.vue"

const catalogType = "http://www.w3.org/ns/dcat#Catalog"
const fullRepositoryType = "http://bartoc.org/full-repository"

const metadataRegistry = {
  uri: "http://bartoc.org/en/node/1",
  prefLabel: { en: "Metadata Registry" },
  definition: {
    en: ["A metadata registry lists and describes terminologies for discovery."],
  },
  type: [catalogType],
  url: "https://metadata.example",
}

const terminologyService = {
  uri: "http://bartoc.org/en/node/2",
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

const terminologyRepository = {
  uri: "http://bartoc.org/en/node/3",
  prefLabel: { en: "Terminology Repository" },
  definition: {
    en: ["A terminology repository contains full terminologies."],
  },
  type: [catalogType, fullRepositoryType],
  url: "https://repository.example",
}

async function mountList(registries = [
  metadataRegistry,
  terminologyService,
  terminologyRepository,
]) {
  vi.stubGlobal("fetch", vi.fn(async () => ({
    json: async () => registries,
  })))

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

    expect(fetch).toHaveBeenCalledWith("/api/registries?limit=1000")
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
      wrapper.get("a[href='/vocabularies?partOf=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F2']").text(),
    ).toBe(
      "12",
    )
    expect(
      wrapper.get("a[href='/vocabularies?partOf=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F2']").attributes("aria-label"),
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
