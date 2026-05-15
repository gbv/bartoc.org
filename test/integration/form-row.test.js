// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import FormRow from "../../vue/components/FormRow.vue"

function mountFormRow(props = {}) {
  return mount(FormRow, {
    props,
    slots: {
      default: "<input data-testid=\"field\" value=\"content\">",
    },
  })
}

describe("FormRow", () => {
  it("renders a label and narrow content column when label is set", () => {
    const wrapper = mountFormRow({ label: "Title" })

    expect(wrapper.get("label").text()).toBe("Title")
    expect(wrapper.get("[data-testid='field']").exists()).toBe(true)
    expect(wrapper.get(".font-weight-light").classes()).toContain("col-sm-10")
  })

  it("renders full-width content without a label", () => {
    const wrapper = mountFormRow()

    expect(wrapper.find("label").exists()).toBe(false)
    expect(wrapper.get("[data-testid='field']").exists()).toBe(true)
    expect(wrapper.get(".font-weight-light").classes()).toContain("col-sm-12")
  })

  it("treats whitespace-only labels as missing", () => {
    const wrapper = mountFormRow({ label: "   " })

    expect(wrapper.find("label").exists()).toBe(false)
    expect(wrapper.get(".font-weight-light").classes()).toContain("col-sm-12")
  })
})
