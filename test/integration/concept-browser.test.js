// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"
import { defineComponent, h } from "vue"
import ConceptBrowser from "../../vue/components/ConceptBrowser.vue"

const utilsMocks = vi.hoisted(() => ({
  registryForScheme: vi.fn(),
  sortConcepts: vi.fn(),
}))

vi.mock("../../vue/utils.js", () => ({
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

const endpoints = [
  { url: "/first/", type: "http://bartoc.org/api-type/jskos" },
  { url: "/second/", type: "http://bartoc.org/api-type/jskos" },
]

const ConceptDetailsStub = {
  props: ["concept", "registry"],
  template: `
    <section data-testid="concept-details">
      <span data-testid="details-uri">{{ concept.uri }}</span>
      <span data-testid="details-registry">{{ registry.id }}</span>
    </section>
  `,
}

const navigateToUri = vi.fn(async () => true)
const ConceptTreeStub = defineComponent({
  name: "ConceptTree",
  props: {
    modelValue: { type: Object, default: null },
    concepts: { type: Array, default: () => [] },
    registry: { type: Object, default: null },
    scheme: { type: Object, default: null },
    itemListOptions: { type: Object, default: () => ({}) },
  },
  emits: ["update:modelValue"],
  setup(props, { emit, expose }) {
    expose({ navigateToUri })
    return () => h("div", { "data-testid": "concept-tree" },
      props.concepts.map(concept => h("button", {
        "data-testid": "tree-concept",
        onClick: () => emit("update:modelValue", concept),
      }, concept.prefLabel?.en || concept.uri)),
    )
  },
})

const ItemSelectStub = {
  props: ["search"],
  emits: ["select"],
  template: `
    <div data-testid="item-select">
      <button
        data-testid="select-search-result"
        @click="$emit('select', { uri: 'concept:from-search' })">
        select search result
      </button>
    </div>
  `,
}

const ServiceLinkStub = {
  props: ["scheme", "endpoint"],
  template: "<span data-testid=\"service-link\">{{ endpoint.url }}</span>",
}

function makeRegistry(concepts = topConcepts, id = "registry") {
  return {
    id,
    _jskos: {
      schemes: [{ VOCID: "voc-id" }],
    },
    getTop: vi.fn(async () => concepts),
    getConcepts: vi.fn(async ({ concepts }) => concepts),
    suggest: vi.fn(async ({ search }) => [search, [], [], []]),
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
        ConceptTree: ConceptTreeStub,
        ConceptDetails: ConceptDetailsStub,
        ItemSelect: ItemSelectStub,
        ServiceLink: ServiceLinkStub,
      },
    },
  })
}

describe("ConceptBrowser", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/vocabulary")
  })

  afterEach(() => {
    utilsMocks.registryForScheme.mockReset()
    utilsMocks.sortConcepts.mockReset()
    navigateToUri.mockClear()
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
  })

  it("waits before showing the API fallback", async () => {
    let finishLoading
    const registry = makeRegistry()
    registry.getTop.mockImplementation(() => new Promise(resolve => {
      finishLoading = resolve
    }))
    utilsMocks.registryForScheme.mockReturnValue(registry)

    const wrapper = mountBrowser()

    expect(wrapper.text()).not.toContain("Access to this repository is possible via APIs")

    finishLoading(topConcepts)
    await flushPromises()

    expect(wrapper.get("[data-testid='concept-tree']").exists()).toBe(true)
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
    const tree = wrapper.getComponent(ConceptTreeStub)
    expect(tree.props()).toMatchObject({
      concepts: topConcepts,
      registry,
      scheme: expect.objectContaining({ uri: "scheme:primary" }),
      itemListOptions: {
        draggable: false,
        itemNameOptions: {
          draggable: false,
          showNotation: false,
        },
      },
    })

    await wrapper.findAll("[data-testid='tree-concept']")[0].trigger("click")
    await flushPromises()

    expect(wrapper.get("[data-testid='concept-details']").exists()).toBe(true)
    expect(wrapper.get("[data-testid='details-uri']").text()).toBe("concept:alpha")
    expect(new URL(window.location.href).searchParams.get("uri")).toBe("concept:alpha")

  })

  it("switches the API used by the browser", async () => {
    const first = makeRegistry(topConcepts, "first")
    const secondConcepts = [{ uri: "concept:gamma", prefLabel: { en: "Gamma" } }]
    const second = makeRegistry(secondConcepts, "second")
    utilsMocks.registryForScheme.mockImplementation(currentScheme =>
      currentScheme.API[0].url === "/second/" ? second : first,
    )

    const wrapper = mountBrowser({ scheme: { ...scheme, API: endpoints } })
    await flushPromises()

    const select = wrapper.get("select")
    expect(select.element.value).toBe("0")

    await wrapper.findAll("[data-testid='tree-concept']")[0].trigger("click")
    await flushPromises()

    await select.setValue("1")
    await flushPromises()

    const tree = wrapper.getComponent(ConceptTreeStub)
    expect(tree.props("registry").id).toBe("second")
    expect(tree.props("concepts")).toEqual(secondConcepts)
    expect(tree.props("scheme").API).toEqual([endpoints[1]])

    const details = wrapper.getComponent(ConceptDetailsStub)
    expect(details.props("registry").id).toBe("second")
    expect(details.props("concept")).toEqual({
      uri: "concept:alpha",
      inScheme: [tree.props("scheme")],
    })
    expect(new URL(window.location.href).searchParams.get("source")).toBe("/second/")
  })

  it("opens search results in the concept tree", async () => {
    const registry = makeRegistry()
    utilsMocks.registryForScheme.mockReturnValue(registry)
    const wrapper = mountBrowser()
    await flushPromises()

    const itemSelect = wrapper.getComponent(ItemSelectStub)
    await itemSelect.props("search")("alpha")
    expect(registry.suggest).toHaveBeenCalledWith({
      search: "alpha",
      scheme: wrapper.getComponent(ConceptTreeStub).props("scheme"),
    })

    await wrapper.get("[data-testid='select-search-result']").trigger("click")
    await flushPromises()

    expect(navigateToUri).toHaveBeenCalledWith({ uri: "concept:from-search" })
    expect(wrapper.get("[data-testid='details-uri']").text()).toBe("concept:from-search")
  })

  it("opens a concept from the URL and exposes concept selection", async () => {
    window.history.replaceState({}, "", "/vocabulary?uri=concept:from-url#browse")
    const registry = makeRegistry()
    utilsMocks.registryForScheme.mockReturnValue(registry)

    const wrapper = mountBrowser()
    await flushPromises()

    expect(wrapper.get("[data-testid='details-uri']").text()).toBe("concept:from-url")
    expect(navigateToUri).toHaveBeenCalledWith(expect.objectContaining({
      uri: "concept:from-url",
    }))
    expect(window.location.hash).toBe("#browse")

    wrapper.vm.selectConcept({ uri: "concept:from-page" })
    await flushPromises()

    expect(wrapper.get("[data-testid='details-uri']").text()).toBe("concept:from-page")
    expect(navigateToUri).toHaveBeenLastCalledWith({ uri: "concept:from-page" })
    expect(new URL(window.location.href).searchParams.get("uri")).toBe("concept:from-page")
    expect(window.location.hash).toBe("#browse")

    wrapper.vm.selectConcept(null)
    await flushPromises()

    expect(wrapper.find("[data-testid='concept-details']").exists()).toBe(false)
    expect(new URL(window.location.href).searchParams.has("uri")).toBe(false)
  })

  it("shows an error for an unknown concept from the URL", async () => {
    window.history.replaceState({}, "", "/vocabulary?uri=concept:missing")
    const registry = makeRegistry()
    registry.getConcepts.mockResolvedValue([])
    utilsMocks.registryForScheme.mockReturnValue(registry)

    const wrapper = mountBrowser()
    await flushPromises()

    expect(wrapper.get("[role='alert']").text()).toBe(
      "This concept was not found in the selected data source.",
    )
  })

  it("opens the data source from the URL", async () => {
    window.history.replaceState({}, "", "/vocabulary?source=%2Fsecond%2F")
    utilsMocks.registryForScheme.mockReturnValue(makeRegistry())

    const wrapper = mountBrowser({ scheme: { ...scheme, API: endpoints } })
    await flushPromises()

    expect(wrapper.get("select").element.value).toBe("1")
  })
})
