// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import SetSelect from "../../vue/components/SetSelect.vue"

const ItemNameStub = {
  props: ["item"],
  template: "<span>{{ item.prefLabel?.en || item.uri }}</span>",
}

const options = [
  { uri: "type:first", prefLabel: { en: "First" } },
  { uri: "type:second", prefLabel: { en: "Second" } },
]

function mountSetSelect(props = {}) {
  return mount(SetSelect, {
    props: {
      modelValue: [],
      options,
      ...props,
    },
    global: {
      stubs: {
        ItemName: ItemNameStub,
      },
    },
  })
}

describe("SetSelect", () => {
  it("renders an array model value as a multiple select", () => {
    const wrapper = mountSetSelect({
      modelValue: [{ uri: "type:first" }],
    })

    const select = wrapper.get("select")

    expect(select.attributes("multiple")).toBeDefined()
    expect(select.attributes("size")).toBe("2")
    expect(select.element.value).toBe("type:first")
    expect(wrapper.text()).toContain("First")
    expect(wrapper.text()).toContain("Second")
  })

  it("emits selected values from a multiple select", async () => {
    const wrapper = mountSetSelect({
      modelValue: [{ uri: "type:first" }],
    })

    const select = wrapper.get("select")
    select.findAll("option")[1].element.selected = true
    await select.trigger("change")

    expect(wrapper.emitted("update:modelValue").at(-1)[0]).toEqual([
      { uri: "type:first" },
      { uri: "type:second" },
    ])
  })

  it("renders and emits a single object model value", async () => {
    const wrapper = mountSetSelect({
      modelValue: { uri: "type:first" },
    })

    const select = wrapper.get("select")

    expect(select.attributes("multiple")).toBeUndefined()
    expect(select.element.value).toBe("type:first")

    await select.setValue("type:second")

    expect(wrapper.emitted("update:modelValue").at(-1)[0]).toEqual({
      uri: "type:second",
    })
  })

  it("updates the selected value when modelValue changes externally", async () => {
    const wrapper = mountSetSelect({
      modelValue: [{ uri: "type:first" }],
    })

    await wrapper.setProps({
      modelValue: [{ uri: "type:second" }],
    })
    await nextTick()

    expect(wrapper.get("select").element.value).toBe("type:second")
  })
})
