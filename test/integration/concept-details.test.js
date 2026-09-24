// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"
import ConceptDetails from "../../vue/components/ConceptDetails.vue"

const utilsMocks = vi.hoisted(() => ({
  sortConcepts: vi.fn((concepts) => concepts),
}))

const componentMocks = vi.hoisted(() => ({
  ItemDetails: {
    props: {
      item: Object,
      flat: Boolean,
      dropzone: Boolean,
      draggable: Boolean,
      fields: Object,
      itemListOptions: Object,
      showAncestors: Boolean,
      showBroader: Boolean,
      showNarrower: Boolean,
    },
    emits: ["select"],
    template: `
      <section data-testid="item-details">
        <span data-testid="selected-name">{{ item.prefLabel?.en }}</span>
        <slot name="afterName" />
        <slot name="afterTabs" />
      </section>
    `,
  },
  ItemList: {
    props: ["items", "draggable", "itemNameOptions"],
    emits: ["select"],
    template: `
      <div>
        <button
          v-for="item in items"
          :key="item.uri"
          @click="$emit('select', { item })">
          {{ item.uri }}
        </button>
      </div>
    `,
  },
}))

vi.mock("../../vue/utils.js", () => ({
  sortConcepts: utilsMocks.sortConcepts,
}))

vi.mock("jskos-vue", () => ({
  ItemDetails: componentMocks.ItemDetails,
  ItemList: componentMocks.ItemList,
}))

const scheme = {
  uri: "scheme:primary",
}

const display = {
  hideNotation: false,
}

const concept = {
  uri: "concept:selected",
  prefLabel: { en: "Selected before load" },
}

const details = {
  prefLabel: { en: "Selected after load" },
  hiddenLabel: { en: ["Hidden label"] },
  historyNote: { en: ["History note"] },
}

const ancestors = [
  { uri: "concept:parent", prefLabel: { en: "Parent" } },
]

const narrower = [
  { uri: "concept:child", prefLabel: { en: "Child" } },
]

function createRegistry() {
  return {
    getConcepts: vi.fn(async () => [details]),
    getAncestors: vi.fn(async () => ancestors),
    getNarrower: vi.fn(async () => narrower),
  }
}

function mountDetails(props = {}) {
  const registry = props.registry || createRegistry()

  const wrapper = mount(ConceptDetails, {
    props: {
      concept: { ...concept },
      registry,
      scheme,
      display,
      ...props,
    },
  })

  return { wrapper, registry }
}

describe("ConceptDetails", () => {
  afterEach(() => {
    utilsMocks.sortConcepts.mockClear()
  })

  it("loads concept details, ancestors and narrower concepts", async () => {
    const { wrapper, registry } = mountDetails()
    await flushPromises()

    const loadedConcept = expect.objectContaining({
      uri: "concept:selected",
      prefLabel: { en: "Selected after load" },
      inScheme: [scheme],
    })

    expect(registry.getConcepts).toHaveBeenCalledWith({
      concepts: [expect.objectContaining({ uri: "concept:selected" })],
    })
    expect(registry.getAncestors).toHaveBeenCalledWith({ concept: loadedConcept })
    expect(registry.getNarrower).toHaveBeenCalledWith({ concept: loadedConcept })
    expect(utilsMocks.sortConcepts).toHaveBeenCalledWith(narrower, scheme)

    const itemDetails = wrapper.getComponent(componentMocks.ItemDetails)
    expect(itemDetails.props()).toMatchObject({
      item: {
        ...concept,
        ...details,
        inScheme: [scheme],
        ancestors,
        narrower,
      },
      flat: true,
      dropzone: false,
      draggable: false,
      showAncestors: false,
      showBroader: false,
      showNarrower: false,
      fields: { prefLabel: false },
      itemListOptions: {
        draggable: false,
        itemNameOptions: {
          draggable: false,
          showNotation: true,
        },
      },
    })
    expect(wrapper.text()).toContain("Hidden label")
    expect(wrapper.text()).toContain("History note")
    expect(wrapper.get(".cc-concept-broader h5").text()).toBe("Broader concept")
    expect(wrapper.get(".cc-concept-narrower h5").text()).toBe("Narrower concepts")
  })

  it("emits selected ancestors and narrower concepts", async () => {
    const { wrapper } = mountDetails()
    await flushPromises()

    await wrapper.get(".cc-concept-broader button").trigger("click")
    await wrapper.get(".cc-concept-narrower button").trigger("click")

    expect(wrapper.emitted("update:concept")).toEqual([
      [ancestors[0]],
      [narrower[0]],
    ])
  })

  it("hides notation when configured by the scheme display options", async () => {
    const { wrapper } = mountDetails({
      display: {
        hideNotation: true,
      },
    })
    await flushPromises()

    const itemDetails = wrapper.getComponent(componentMocks.ItemDetails)
    expect(itemDetails.props("itemListOptions").itemNameOptions.showNotation).toBe(false)
    expect(itemDetails.classes()).toContain("cc-concept-item-details--hide-notation")
  })

  it("links a notation to the K10plus catalog", async () => {
    const registry = createRegistry()
    registry.getConcepts.mockResolvedValue([{ notation: ["20"] }])
    const { wrapper } = mountDetails({ registry, scheme: { CQLKEY: "DDC" } })
    await flushPromises()

    expect(wrapper.get(".cc-concept-catalog-link").attributes("href"))
      .toBe("https://opac.k10plus.de/DB=2.299/CMD?ACT=SRCHA&IKT=3011&TRM=20")
  })
})
