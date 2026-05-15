// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"
import ConceptDetails from "../../vue/components/ConceptDetails.vue"

const utilsMocks = vi.hoisted(() => ({
  sortConcepts: vi.fn((concepts) => concepts),
}))

vi.mock("../../vue/utils.js", () => ({
  sortConcepts: utilsMocks.sortConcepts,
}))

const IconStub = {
  props: ["name"],
  template: "<span data-testid=\"icon\">{{ name }}</span>",
}

const ItemLabelsStub = {
  props: ["item"],
  template: `
    <div data-testid="item-labels">
      {{ item.altLabel?.en?.join(",") || "" }}
    </div>
  `,
}

const ItemNameStub = {
  props: ["item", "notation"],
  template: `
    <span data-testid="item-name">
      {{ item.prefLabel?.en || item.uri }}:{{ notation }}
    </span>
  `,
}

const ItemNotesStub = {
  props: ["item"],
  template: `
    <div data-testid="item-notes">
      {{ item.definition?.en?.[0] || "" }}
    </div>
  `,
}

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
  altLabel: { en: ["Loaded alias"] },
  definition: { en: ["Loaded definition"] },
  notation: ["A.1"],
  identifier: ["ID-1"],
  created: "2024-01-02",
}

const ancestors = [
  { uri: "concept:parent", prefLabel: { en: "Parent" } },
  { uri: "concept:root", prefLabel: { en: "Root" } },
]

const narrower = [
  { uri: "concept:child-b", prefLabel: { en: "Child B" } },
  { uri: "concept:child-a", prefLabel: { en: "Child A" } },
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
    global: {
      stubs: {
        Icon: IconStub,
        ItemLabels: ItemLabelsStub,
        ItemName: ItemNameStub,
        ItemNotes: ItemNotesStub,
      },
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

    expect(wrapper.findAll("[data-testid='item-name']").map(item => item.text())).toEqual([
      "Root:true",
      "Parent:true",
      "Selected after load:true",
      "Child B:true",
      "Child A:true",
    ])
    expect(wrapper.get("[data-testid='item-labels']").text()).toBe("Loaded alias")
    expect(wrapper.get("[data-testid='item-notes']").text()).toBe("Loaded definition")
    expect(wrapper.get("a[href='concept:selected']").text()).toBe("concept:selected")
    expect(wrapper.text()).toContain("ID-1")
    expect(wrapper.text()).toContain("2024-01-02")
  })

  it("emits selected ancestors and narrower concepts", async () => {
    const { wrapper } = mountDetails()
    await flushPromises()

    await wrapper.findAll("ul.ancestors li")[0].trigger("click")
    await wrapper.findAll("ul.narrower li")[1].trigger("click")

    expect(wrapper.emitted("update:concept")).toEqual([
      [ancestors[1]],
      [narrower[1]],
    ])
  })

  it("hides notation when configured by the scheme display options", async () => {
    const { wrapper } = mountDetails({
      display: {
        hideNotation: true,
      },
    })
    await flushPromises()

    expect(wrapper.findAll("[data-testid='item-name']").map(item => item.text())).toContain(
      "Selected after load:false",
    )
  })
})
