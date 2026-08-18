// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"
import ConceptBrowser from "../../vue/components/ConceptBrowser.vue"

const utilsMocks = vi.hoisted(() => ({
  registryForScheme: vi.fn(),
  sortConcepts: vi.fn(),
}))

vi.mock("../../vue/utils.js", () => ({
  apiTypesScheme: { uri: "api-types" },
  registryForScheme: utilsMocks.registryForScheme,
  sortConcepts: utilsMocks.sortConcepts,
}))

const scheme = {
  uri: "scheme:primary",
  identifier: ["scheme:alias"],
  API: [{ url: "/api/", type: "http://bartoc.org/api-type/jskos" }],
  DISPLAY: {
    hideNotation: true,
  },
}

const topConcepts = [
  {
    uri: "concept:alpha",
    prefLabel: { en: "Alpha" },
  },
  {
    uri: "concept:beta",
    prefLabel: { en: "Beta" },
  },
]

const ConceptDetailsStub = {
  props: ["concept", "scheme", "display", "registry"],
  emits: ["update:concept"],
  template: `
    <section data-testid="concept-details">
      <span data-testid="details-uri">{{ concept.uri }}</span>
      <span data-testid="details-scheme">{{ scheme.VOCID }}</span>
      <span data-testid="details-display">{{ display.hideNotation }}</span>
      <span data-testid="details-registry">{{ registry.id }}</span>
    </section>
  `,
}

const IconStub = {
  props: ["name"],
  template: "<span data-testid=\"icon\">{{ name }}</span>",
}

const ItemNameStub = {
  props: ["item", "notation"],
  template: `
    <span data-testid="item-name">
      {{ item.prefLabel?.en || item.uri }}:{{ notation }}
    </span>
  `,
}

const ItemSelectStub = {
  props: ["scheme", "extractValue"],
  emits: ["change"],
  template: `
    <div data-testid="item-select">
      <span data-testid="item-select-scheme">{{ scheme.VOCID }}</span>
      <button
        data-testid="select-search-result"
        @click="$emit('change', extractValue({ uri: 'concept:from-search' }))">
        select search result
      </button>
    </div>
  `,
}

const ServiceLinkStub = {
  props: ["scheme", "endpoint"],
  template: "<span data-testid=\"service-link\">{{ endpoint.url }}</span>",
}

function makeRegistry(concepts = topConcepts) {
  return {
    id: "registry",
    _jskos: {
      schemes: [{ VOCID: "voc-id" }],
    },
    getTop: vi.fn(async () => concepts),
  }
}

function mountBrowser(props = {}) {
  return mount(ConceptBrowser, {
    props: {
      scheme,
      ...props,
    },
    global: {
      stubs: {
        ConceptDetails: ConceptDetailsStub,
        Icon: IconStub,
        ItemName: ItemNameStub,
        ItemSelect: ItemSelectStub,
        ServiceLink: ServiceLinkStub,
      },
    },
  })
}

describe("ConceptBrowser", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/vocabulary")
    vi.spyOn(console, "debug").mockImplementation(() => {})
    vi.spyOn(console, "info").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    utilsMocks.registryForScheme.mockReset()
    utilsMocks.sortConcepts.mockReset()
    vi.restoreAllMocks()
  })

  it("shows API links when no registry can browse the scheme", async () => {
    utilsMocks.registryForScheme.mockReturnValue(null)

    const wrapper = mountBrowser()
    await flushPromises()

    expect(wrapper.text()).toContain("Access to this repository is possible via APIs")
    expect(wrapper.get("[data-testid='service-link']").text()).toBe("/api/")
    expect(utilsMocks.registryForScheme).toHaveBeenCalledWith(expect.objectContaining({
      uri: "scheme:primary",
    }))
  })

  it("falls back to API links when the registry rejects every scheme URI", async () => {
    const registry = makeRegistry()
    registry.getTop.mockRejectedValue(new Error("Unsupported scheme"))
    utilsMocks.registryForScheme.mockReturnValue(registry)

    const wrapper = mountBrowser()
    await flushPromises()

    expect(registry.getTop).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain("Access to this repository is possible via APIs")
    expect(wrapper.find("[data-testid='item-select']").exists()).toBe(false)
    expect(console.error).not.toHaveBeenCalled()
  })

  it("loads top concepts and updates the URL when a concept is selected", async () => {
    const registry = makeRegistry()
    utilsMocks.registryForScheme.mockReturnValue(registry)

    const wrapper = mountBrowser()
    await flushPromises()

    expect(registry.getTop).toHaveBeenCalledWith({
      scheme: expect.objectContaining({
        uri: "scheme:primary",
        VOCID: "voc-id",
      }),
    })
    expect(utilsMocks.sortConcepts).toHaveBeenCalledWith(topConcepts, scheme)
    expect(wrapper.get("[data-testid='item-select-scheme']").text()).toBe("voc-id")
    expect(wrapper.findAll("[data-testid='item-name']").map(item => item.text())).toEqual([
      "Alpha:false",
      "Beta:false",
    ])

    await wrapper.findAll("li")[0].trigger("click")
    await flushPromises()

    expect(wrapper.get("[data-testid='concept-details']").exists()).toBe(true)
    expect(wrapper.get("[data-testid='details-uri']").text()).toBe("concept:alpha")
    expect(new URL(window.location.href).searchParams.get("uri")).toBe("concept:alpha")

    await wrapper.get("h4.clickable").trigger("click")
    await flushPromises()

    expect(wrapper.find("[data-testid='concept-details']").exists()).toBe(false)
    expect(new URL(window.location.href).searchParams.has("uri")).toBe(false)
  })

  it("opens a concept from the URL and exposes concept selection", async () => {
    window.history.replaceState({}, "", "/vocabulary?uri=concept:from-url#browse")
    const registry = makeRegistry()
    utilsMocks.registryForScheme.mockReturnValue(registry)

    const wrapper = mountBrowser()
    await flushPromises()

    expect(wrapper.get("[data-testid='details-uri']").text()).toBe("concept:from-url")
    expect(wrapper.get("[data-testid='details-scheme']").text()).toBe("voc-id")
    expect(window.location.hash).toBe("#browse")

    wrapper.vm.selectConcept({ uri: "concept:from-page" })
    await flushPromises()

    expect(wrapper.get("[data-testid='details-uri']").text()).toBe("concept:from-page")
    expect(new URL(window.location.href).searchParams.get("uri")).toBe("concept:from-page")
    expect(window.location.hash).toBe("#browse")
  })
})
