// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import ItemSelect from "../../vue/components/ItemSelect.vue"

const utilsMocks = vi.hoisted(() => ({
  registryForScheme: vi.fn(),
  sortConcepts: vi.fn(concepts => concepts),
}))

const jskosMocks = vi.hoisted(() => ({
  notation: vi.fn(concept => concept.notation?.[0] || ""),
  prefLabel: vi.fn(concept => concept.prefLabel?.en || ""),
}))

vi.mock("../../vue/utils.js", () => ({
  registryForScheme: utilsMocks.registryForScheme,
  sortConcepts: utilsMocks.sortConcepts,
}))

vi.mock("jskos-tools", () => ({
  default: jskosMocks,
}))

const MultiselectStub = {
  name: "Multiselect",
  props: [
    "modelValue",
    "mode",
    "caret",
    "options",
    "filterResults",
    "minChars",
    "resolveOnLoad",
    "delay",
    "searchable",
    "loading",
    "placeholder",
  ],
  emits: ["update:modelValue", "change"],
  template: "<div data-testid=\"multiselect\"></div>",
}

function mountItemSelect(props = {}) {
  return mount(ItemSelect, {
    props: {
      scheme: { uri: "scheme:test" },
      ...props,
    },
    global: {
      stubs: {
        Multiselect: MultiselectStub,
      },
    },
  })
}

function resolvedPromise(value) {
  const promise = Promise.resolve(value)
  promise.cancel = vi.fn()
  return promise
}

describe("ItemSelect", () => {
  afterEach(() => {
    utilsMocks.registryForScheme.mockReset()
    utilsMocks.sortConcepts.mockClear()
    jskosMocks.notation.mockClear()
    jskosMocks.prefLabel.mockClear()
  })

  it("uses local scheme concepts when no registry is available", () => {
    utilsMocks.registryForScheme.mockReturnValue(null)
    const concepts = [{ uri: "concept:a", prefLabel: { en: "A" } }]
    const wrapper = mountItemSelect({
      scheme: {
        uri: "scheme:test",
        concepts,
      },
    })

    const multiselect = wrapper.getComponent({ name: "Multiselect" })

    expect(multiselect.props("options")).toEqual(concepts)
  })

  it("keeps repeatable selects in tag mode with an array model value", () => {
    utilsMocks.registryForScheme.mockReturnValue(null)
    const wrapper = mountItemSelect({ repeatable: true })

    const multiselect = wrapper.getComponent({ name: "Multiselect" })

    expect(multiselect.props("mode")).toBe("tags")
    expect(multiselect.props("caret")).toBe(false)
    expect(multiselect.props("modelValue")).toEqual([])
  })

  it("emits model updates from multiselect change events", async () => {
    utilsMocks.registryForScheme.mockReturnValue(null)
    const wrapper = mountItemSelect()

    wrapper.getComponent({ name: "Multiselect" }).vm.$emit("change", "concept:a")

    expect(wrapper.emitted("update:modelValue")).toEqual([["concept:a"]])
  })

  it("searches the registry and maps concepts through extractors", async () => {
    const registry = {
      search: vi.fn(() => resolvedPromise([
        {
          uri: "concept:a",
          notation: ["A"],
          prefLabel: { en: "Alpha" },
        },
      ])),
    }
    const scheme = { uri: "scheme:test" }
    utilsMocks.registryForScheme.mockReturnValue(registry)
    const wrapper = mountItemSelect({ scheme })

    const options = wrapper.getComponent({ name: "Multiselect" }).props("options")
    const results = await options("alp")

    expect(registry.search).toHaveBeenCalledWith({ search: "alp", scheme })
    expect(results).toEqual([
      {
        value: "concept:a",
        label: "A Alpha",
      },
    ])
  })

  it("loads top concepts with direct narrower concepts when depth is greater than one", async () => {
    const child = {
      uri: "concept:child",
      notation: ["C"],
      prefLabel: { en: "Child" },
    }
    const topConcepts = [
      {
        uri: "concept:parent",
        notation: ["P"],
        prefLabel: { en: "Parent" },
        narrower: [null, child],
      },
    ]
    const registry = {
      getTop: vi.fn(() => resolvedPromise(topConcepts)),
    }
    const scheme = { uri: "scheme:test" }
    utilsMocks.registryForScheme.mockReturnValue(registry)
    const wrapper = mountItemSelect({ depth: 2, scheme })

    const options = wrapper.getComponent({ name: "Multiselect" }).props("options")
    const results = await options("")

    expect(registry.getTop).toHaveBeenCalledWith({
      scheme,
      params: { properties: "*" },
    })
    expect(utilsMocks.sortConcepts).toHaveBeenCalledWith(topConcepts, scheme)
    expect(results).toEqual([
      {
        value: "concept:parent",
        label: "P Parent",
      },
      {
        value: "concept:child",
        label: "C \u2014 Child",
      },
    ])
  })
})
