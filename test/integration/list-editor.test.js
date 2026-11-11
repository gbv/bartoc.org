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
  it("adds values without sending empty rows", async () => {
    const wrapper = mountListEditor(["first"])

    expect(inputValues(wrapper)).toEqual(["first"])

    await wrapper.get("button:not([aria-label])").trigger("click")

    expect(inputValues(wrapper)).toEqual(["first", ""])
    expect(wrapper.emitted("update:modelValue")).toBeUndefined()

    await wrapper.findAll("input")[1].setValue("second")

    expect(wrapper.emitted("update:modelValue").at(-1)[0]).toEqual([
      "first",
      "second",
    ])
  })
})
