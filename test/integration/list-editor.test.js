// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import ListEditor from "../../vue/components/ListEditor.vue"

function mountListEditor(modelValue = []) {
  return mount(ListEditor, {
    props: {
      modelValue,
    },
  })
}

function inputValues(wrapper) {
  return wrapper.findAll("input").map(input => input.element.value)
}

describe("ListEditor", () => {
  it("loads values and keeps one empty row", () => {
    const wrapper = mountListEditor(["first", "second"])

    expect(inputValues(wrapper)).toEqual(["first", "second", ""])
  })

  it("emits updates and appends a new empty row after filling the blank one", async () => {
    const wrapper = mountListEditor(["first"])

    await wrapper.findAll("input")[1].setValue("second")

    expect(inputValues(wrapper)).toEqual(["first", "second", ""])
    expect(wrapper.emitted("update:modelValue").at(-1)[0]).toEqual([
      "first",
      "second",
      "",
    ])
  })

  it("removes a row", async () => {
    const wrapper = mountListEditor(["first", "second"])

    await wrapper.findAll("button")[2].trigger("click")

    expect(inputValues(wrapper)).toEqual(["second", ""])
    expect(wrapper.emitted("update:modelValue").at(-1)[0]).toEqual(["second", ""])
  })

  it("moves rows up and down", async () => {
    const wrapper = mountListEditor(["first", "second"])

    await wrapper.findAll("button")[3].trigger("click")
    expect(inputValues(wrapper)).toEqual(["second", "first", ""])

    await wrapper.findAll("button")[1].trigger("click")
    expect(inputValues(wrapper)).toEqual(["first", "second", ""])
  })
})
