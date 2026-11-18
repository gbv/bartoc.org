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
  it("renders labelled editor content when a label is set", () => {
    const wrapper = mountFormRow({ label: "Title" })

    expect(wrapper.get("label").text()).toBe("Title")
    expect(wrapper.get("label span").attributes("title")).toBeUndefined()
    expect(wrapper.get("[data-testid='field']").exists()).toBe(true)
    expect(wrapper.get(".editor-form-content").classes()).toEqual(["editor-form-content"])
  })

  it("shows field help on the label text", () => {
    const wrapper = mountFormRow({ label: "Abbreviation", field: "abbreviation" })
    const label = wrapper.get("label span")

    expect(label.attributes("title")).toBe(
      "Common, unique abbreviation, acronym, or notation the terminology is known under",
    )
    expect(label.classes()).toContain("has-help")
    expect(wrapper.get("label").attributes("title")).toBeUndefined()
  })

  it("renders full-width content without a label", () => {
    const wrapper = mountFormRow()

    expect(wrapper.find("label").exists()).toBe(false)
    expect(wrapper.get("[data-testid='field']").exists()).toBe(true)
    expect(wrapper.get(".editor-form-content").exists()).toBe(true)
  })

  it("treats whitespace-only labels as missing", () => {
    const wrapper = mountFormRow({ label: "   " })

    expect(wrapper.find("label").exists()).toBe(false)
    expect(wrapper.get(".editor-form-content").exists()).toBe(true)
  })
})
