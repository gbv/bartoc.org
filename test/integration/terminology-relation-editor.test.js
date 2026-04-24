// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"
import TerminologyRelationEditor from "../../vue/components/TerminologyRelationEditor.vue"

const records = {
  "http://bartoc.org/en/node/520": {
    uri: "http://bartoc.org/en/node/520",
    prefLabel: {
      en: "DFG Systematics of the subjects and colleges of the German Research Association",
    },
    notation: ["DFG"],
  },
  "http://bartoc.org/en/node/20541": {
    uri: "http://bartoc.org/en/node/20541",
    prefLabel: {
      en: "DFG Systematics of the subjects and colleges of the German Research Association (2016-2019)",
    },
    notation: ["DFG"],
  },
  "http://bartoc.org/en/node/20542": {
    uri: "http://bartoc.org/en/node/20542",
    prefLabel: {
      en: "DFG Systematics of the subjects and colleges of the German Research Association (2020-2024)",
    },
    notation: ["DFG"],
  },
}

const ItemSelectStub = {
  props: ["search", "placeholder", "showTree"],
  emits: ["select"],
  template: `
    <div data-testid="item-select">
      <button
        data-testid="select-520"
        @click="$emit('select', { uri: 'http://bartoc.org/en/node/520' })">
        select 520
      </button>
      <button
        data-testid="select-20541"
        @click="$emit('select', { uri: 'http://bartoc.org/en/node/20541' })">
        select 20541
      </button>
      <button
        data-testid="select-20542"
        @click="$emit('select', { uri: 'http://bartoc.org/en/node/20542' })">
        select 20542
      </button>
    </div>
  `,
}

const ItemSelectedStub = {
  props: ["modelValue", "view", "removable"],
  emits: ["update:modelValue"],
  template: `
    <div data-testid="item-selected">
      <div
        v-for="item in modelValue"
        :key="item.uri"
        class="selected-row">
        <span class="selected-notation">{{ item.notation?.[0] || '' }}</span>
        <span class="selected-label">{{ item.prefLabel?.en || '' }}</span>
      </div>
      <button
        data-testid="remove-first"
        @click="$emit('update:modelValue', modelValue.slice(1))">
        remove first
      </button>
    </div>
  `,
}

function makeFetchResponse(data, ok = true) {
  return {
    ok,
    json: async () => data,
  }
}

function mountEditor(props = {}) {
  return mount(TerminologyRelationEditor, {
    props: {
      modelValue: [],
      multiple: true,
      placeholder: "Search BARTOC terminologies…",
      ...props,
    },
    global: {
      stubs: {
        ItemSelect: ItemSelectStub,
        ItemSelected: ItemSelectedStub,
      },
    },
  })
}

describe("TerminologyRelationEditor", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input) => {
        const url = new URL(String(input), "http://localhost")

        if (url.pathname === "/api/voc") {
          const uri = url.searchParams.get("uri")
          const record = records[uri]
          return makeFetchResponse(record ? [record] : [])
        }

        if (url.pathname === "/api/voc/suggest") {
          return makeFetchResponse([
            "dfg",
            [
              "DFG Systematics of the subjects and colleges of the German Research Association",
            ],
            [""],
            ["http://bartoc.org/en/node/520"],
          ])
        }

        return makeFetchResponse([], false)
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("loads selected items from modelValue", async () => {
    const wrapper = mountEditor({
      modelValue: [{ uri: "http://bartoc.org/en/node/520" }],
      multiple: false,
    })

    await flushPromises()

    expect(wrapper.find("[data-testid='item-selected']").exists()).toBe(true)
    expect(wrapper.text()).toContain("node 520")
    expect(wrapper.text()).toContain(
      "DFG Systematics of the subjects and colleges of the German Research Association",
    )
  })

  it("replaces the selection in single mode", async () => {
    const wrapper = mountEditor({
      modelValue: [],
      multiple: false,
    })

    await wrapper.get("[data-testid='select-20541']").trigger("click")
    await flushPromises()

    await wrapper.get("[data-testid='select-20542']").trigger("click")
    await flushPromises()

    const emitted = wrapper.emitted("update:modelValue")
    expect(emitted).toBeTruthy()

    const lastValue = emitted.at(-1)[0]
    expect(lastValue).toEqual([
      { uri: "http://bartoc.org/en/node/20542" },
    ])

    expect(wrapper.text()).toContain("node 20542")
    expect(wrapper.text()).not.toContain("node 20541")
  })

  it("adds and deduplicates in multiple mode", async () => {
    const wrapper = mountEditor({
      modelValue: [],
      multiple: true,
    })

    await wrapper.get("[data-testid='select-520']").trigger("click")
    await flushPromises()

    await wrapper.get("[data-testid='select-520']").trigger("click")
    await flushPromises()

    await wrapper.get("[data-testid='select-20541']").trigger("click")
    await flushPromises()

    const emitted = wrapper.emitted("update:modelValue")
    expect(emitted).toBeTruthy()

    const lastValue = emitted.at(-1)[0]
    expect(lastValue).toEqual([
      { uri: "http://bartoc.org/en/node/520" },
      { uri: "http://bartoc.org/en/node/20541" },
    ])

    expect(wrapper.text()).toContain("node 520")
    expect(wrapper.text()).toContain("node 20541")
  })

  it("emits reduced uri-only values when a selected item is removed", async () => {
    const wrapper = mountEditor({
      modelValue: [
        { uri: "http://bartoc.org/en/node/520" },
        { uri: "http://bartoc.org/en/node/20541" },
      ],
      multiple: true,
    })

    await flushPromises()

    await wrapper.get("[data-testid='remove-first']").trigger("click")
    await flushPromises()

    const emitted = wrapper.emitted("update:modelValue")
    expect(emitted).toBeTruthy()

    const lastValue = emitted.at(-1)[0]
    expect(lastValue).toEqual([
      { uri: "http://bartoc.org/en/node/20541" },
    ])
  })
})
