// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import RegistryList from "../../vue/components/RegistryList.vue"

const catalogType = "http://www.w3.org/ns/dcat#Catalog"
const fullRepositoryType = "http://bartoc.org/full-repository"

const metadataRegistry = {
  uri: "http://bartoc.org/en/node/1",
  prefLabel: { en: "Metadata Registry" },
  type: [catalogType],
  url: "https://metadata.example",
}

const terminologyService = {
  uri: "http://bartoc.org/en/node/2",
  prefLabel: { en: "Terminology Service" },
  type: [catalogType, fullRepositoryType],
  url: "https://service.example",
  API: [
    {
      type: "http://bartoc.org/api-type/jskos",
      url: "https://service.example/api",
    },
  ],
}

const terminologyRepository = {
  uri: "http://bartoc.org/en/node/3",
  prefLabel: { en: "Terminology Repository" },
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
  it("groups registries by function", () => {
    const wrapper = mountList()

    expect(wrapper.findAll("h2").map(heading => heading.text())).toEqual([
      "Metadata Registries",
      "Terminology Services",
      "Terminology Repositories",
    ])

    expect(wrapper.text()).toContain(
      "Metadata registries list and describe terminologies.",
    )
    expect(wrapper.text()).toContain(
      "Terminology services provide access to terminologies via an API.",
    )
  })

  it("renders the compact registry table", () => {
    const wrapper = mountList()

    expect(wrapper.find("thead").findAll("th").map(th => th.text())).toEqual([
      "Name",
      "Homepage",
      "API / Service links",
    ])

    expect(wrapper.get("a[href='/en/node/2']").text()).toBe(
      "Terminology Service",
    )
    expect(wrapper.get("a[href='https://service.example']").text()).toBe(
      "Homepage",
    )
    expect(wrapper.get("a[href='https://service.example/api']").text()).toBe(
      "JSKOS API",
    )
  })

  it("hides empty function groups", () => {
    const wrapper = mountList([terminologyService])

    expect(wrapper.findAll("h2").map(heading => heading.text())).toEqual([
      "Terminology Services",
    ])
    expect(wrapper.find("#metadata-registries").exists()).toBe(false)
  })

  it("shows an empty state", () => {
    const wrapper = mountList([])

    expect(wrapper.text()).toContain("No registries found.")
  })
})
