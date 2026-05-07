// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
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
  terminologiesCount: 12,
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

function mountList(registries = [
  metadataRegistry,
  terminologyService,
  terminologyRepository,
]) {
  return mount(RegistryList, {
    props: { registries },
  })
}

describe("RegistryList", () => {
  it("shows toggle buttons for registry functions", () => {
    const wrapper = mountList()

    expect(wrapper.findAll("button").map(button => button.text())).toEqual([
      "Metadata Registries 1",
      "Terminology Services 1",
      "Terminology Repositories 1",
    ])

    expect(wrapper.text()).toContain(
      "Registries can be filtered by function.",
    )
  })

  it("renders the compact registry table", () => {
    const wrapper = mountList()

    expect(wrapper.find("thead").findAll("th").map(th => th.text())).toEqual([
      "Name",
      "Function",
      "Description",
      "Terminologies",
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
    const wrapper = mountList()

    await wrapper.findAll("button")[1].trigger("click")

    const rows = wrapper.findAll("tbody tr").map(row => row.text())

    expect(rows.some(row => row.includes("Metadata Registry"))).toBe(true)
    expect(rows.some(row => row.includes("Terminology Service"))).toBe(false)
    expect(rows.some(row => row.includes("Terminology Repository"))).toBe(true)
  })

  it("shows an empty state", () => {
    const wrapper = mountList([])

    expect(wrapper.text()).toContain("No registries found.")
  })
})
