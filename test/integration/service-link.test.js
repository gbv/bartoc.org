// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"
import ServiceLink from "../../vue/components/ServiceLink.vue"

const utilsMocks = vi.hoisted(() => {
  const registry = {
    getConcepts: vi.fn(async ({ concepts }) => concepts.map(concept => ({
      ...concept,
      prefLabel: { en: `Label for ${concept.uri}` },
    }))),
  }

  return {
    registry,
    registryForScheme: vi.fn(() => registry),
  }
})

vi.mock("../../vue/utils.js", () => ({
  apiTypesScheme: { uri: "http://bartoc.org/en/node/20002" },
  registryForScheme: utilsMocks.registryForScheme,
}))

const ItemNameStub = {
  props: ["item"],
  template: "<span data-testid=\"item-name\">{{ item.prefLabel?.en || item.uri }}</span>",
}

function mountServiceLink(props = {}) {
  return mount(ServiceLink, {
    props: {
      endpoint: {
        url: "https://api.dante.gbv.de/data",
        type: "type:first",
      },
      scheme: {
        uri: "scheme:test",
      },
      ...props,
    },
    global: {
      stubs: {
        ItemName: ItemNameStub,
      },
    },
  })
}

describe("ServiceLink", () => {
  afterEach(() => {
    utilsMocks.registry.getConcepts.mockClear()
  })

  it("loads the API type and reloads when the endpoint changes", async () => {
    const wrapper = mountServiceLink()
    await flushPromises()

    expect(wrapper.find("a").attributes("href")).toBe("https://api.dante.gbv.de/data")
    expect(wrapper.find("[data-testid='item-name']").text()).toBe("Label for type:first")
    expect(wrapper.text()).toContain("Cocoda Mapping Tool")
    expect(utilsMocks.registry.getConcepts).toHaveBeenLastCalledWith({
      concepts: [{ uri: "type:first" }],
    })

    await wrapper.setProps({
      endpoint: {
        url: "https://example.org/api",
        type: "type:second",
      },
    })
    await flushPromises()

    expect(wrapper.find("a").attributes("href")).toBe("https://example.org/api")
    expect(wrapper.find("[data-testid='item-name']").text()).toBe("Label for type:second")
    expect(wrapper.text()).not.toContain("Cocoda Mapping Tool")
    expect(utilsMocks.registry.getConcepts).toHaveBeenLastCalledWith({
      concepts: [{ uri: "type:second" }],
    })
  })
})
