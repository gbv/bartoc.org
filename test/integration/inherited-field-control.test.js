// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import InheritedFieldControl from "../../vue/components/InheritedFieldControl.vue"

const source = {
  uri: "http://bartoc.org/en/node/21133",
  prefLabel: { en: "Main terminology" },
}

function mountControl(props = {}) {
  return mount(InheritedFieldControl, {
    props,
    slots: {
      inherited: "<p data-testid=\"inherited-value\">Inherited value</p>",
      editor: "<input data-testid=\"local-editor\" value=\"Local value\">",
    },
  })
}

describe("InheritedFieldControl", () => {
  it("shows a read-only inherited value and starts an override", async () => {
    const wrapper = mountControl({ mode: "inherited", source })

    expect(wrapper.find("[data-testid='inherited-value']").exists()).toBe(true)
    expect(wrapper.find("[data-testid='local-editor']").exists()).toBe(false)
    expect(wrapper.find("[data-testid='inherited-field-notice']").exists()).toBe(true)

    await wrapper.get("[data-testid='start-override']").trigger("click")

    expect(wrapper.emitted("startOverride")).toHaveLength(1)
  })

  it("shows the local editor and offers to use the main value", async () => {
    const wrapper = mountControl({ mode: "override", source })

    expect(wrapper.get("[data-testid='local-editor']").exists()).toBe(true)
    expect(wrapper.find("[data-testid='inherited-value']").exists()).toBe(false)

    await wrapper.get("[data-testid='use-main']").trigger("click")

    expect(wrapper.emitted("useMain")).toHaveLength(1)
  })

  it("shows an ordinary editor when no inherited value is available", () => {
    const wrapper = mountControl()

    expect(wrapper.attributes("data-mode")).toBe("editable")
    expect(wrapper.get("[data-testid='local-editor']").exists()).toBe(true)
    expect(wrapper.find("[data-testid='inherited-value']").exists()).toBe(false)
    expect(wrapper.find("button").exists()).toBe(false)
  })
})
