// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import ConceptSchemePicker from "../../vue/components/ConceptSchemePicker.vue"

const ItemSelectStub = {
  props: [
    "search",
    "placeholder",
    "showTree",
    "treeConcepts",
    "treeLoadNarrower",
  ],
  emits: ["select"],
  template: `
    <div data-testid="item-select">
      <button
        data-testid="select-item"
        @click="$emit('select', { uri: 'http://example.org/a', prefLabel: { en: 'A' } })">
        select
      </button>
    </div>
  `,
}

const ItemSelectedStub = {
  props: ["modelValue", "view", "removable"],
  emits: ["update:modelValue"],
  template: `
    <div data-testid="item-selected">
      {{ JSON.stringify(modelValue) }}
    </div>
  `,
}

function createProvider(overrides = {}) {
  return {
    loadTop: vi.fn().mockResolvedValue([
      { uri: "http://example.org/top" },
    ]),
    loadSelected: vi.fn().mockImplementation(async (value) => value || []),
    search: vi.fn().mockResolvedValue(["", [], [], []]),
    loadNarrower: vi.fn(),
    toModel: vi.fn((items) => items.map(({ uri }) => ({ uri }))),
    ...overrides,
  }
}

async function mountPicker(props = {}) {
  const provider = props.provider || createProvider()

  const wrapper = mount(ConceptSchemePicker, {
    props: {
      modelValue: [],
      provider,
      ...props,
    },
    global: {
      stubs: {
        ItemSelect: ItemSelectStub,
        ItemSelected: ItemSelectedStub,
      },
    },
  })

  await nextTick()
  await nextTick()

  return { wrapper, provider }
}

describe("ConceptSchemePicker", () => {
  it("loads top concepts and initial selected items on create", async () => {
    const modelValue = [{ uri: "http://example.org/a" }]
    const { wrapper, provider } = await mountPicker({ modelValue })

    expect(provider.loadTop).toHaveBeenCalledTimes(1)
    expect(provider.loadSelected).toHaveBeenCalledWith(modelValue)
    expect(wrapper.vm.treeConcepts).toEqual([{ uri: "http://example.org/top" }])
    expect(wrapper.vm.selected).toEqual(modelValue)
  })

  it("adds a selected item and emits update:modelValue", async () => {
    const { wrapper, provider } = await mountPicker()

    await wrapper.get("[data-testid='select-item']").trigger("click")
    await nextTick()

    expect(wrapper.vm.selected).toEqual([
      { uri: "http://example.org/a", prefLabel: { en: "A" } },
    ])

    expect(provider.toModel).toHaveBeenCalled()
    expect(wrapper.emitted("update:modelValue")).toBeTruthy()
    expect(wrapper.emitted("update:modelValue").at(-1)).toEqual([
      [{ uri: "http://example.org/a" }],
    ])
  })

  it("does not add the same item twice", async () => {
    const { wrapper } = await mountPicker()

    await wrapper.get("[data-testid='select-item']").trigger("click")
    await nextTick()
    await wrapper.get("[data-testid='select-item']").trigger("click")
    await nextTick()

    expect(wrapper.vm.selected).toHaveLength(1)
  })

  it("updates selected when modelValue changes externally", async () => {
    const provider = createProvider({
      loadSelected: vi.fn().mockImplementation(async (value) => [
        ...value,
        { uri: "http://example.org/full" },
      ]),
    })

    const { wrapper } = await mountPicker({ provider, modelValue: [] })

    await wrapper.setProps({
      modelValue: [{ uri: "http://example.org/b" }],
    })
    await nextTick()
    await nextTick()

    expect(provider.loadSelected).toHaveBeenLastCalledWith([
      { uri: "http://example.org/b" },
    ])
    expect(wrapper.vm.selected).toEqual([
      { uri: "http://example.org/b" },
      { uri: "http://example.org/full" },
    ])
  })
})
