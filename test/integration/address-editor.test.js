// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import AddressEditor from "../../vue/components/AddressEditor.vue"

function mountAddressEditor(modelValue = {}) {
  return mount(AddressEditor, {
    props: {
      modelValue,
    },
  })
}

function inputValues(wrapper) {
  return wrapper.findAll("input").map(input => input.element.value)
}

describe("AddressEditor", () => {
  it("renders values from modelValue", () => {
    const wrapper = mountAddressEditor({
      street: "Main Street 1",
      ext: "Room 2",
      locality: "Berlin",
      region: "Berlin",
      code: "10115",
      country: "Germany",
    })

    expect(inputValues(wrapper)).toEqual([
      "Main Street 1",
      "Room 2",
      "Berlin",
      "Berlin",
      "10115",
      "Germany",
    ])
  })

  it("emits the full address when a field changes", async () => {
    const wrapper = mountAddressEditor({
      street: "Main Street 1",
      ext: "",
      locality: "Berlin",
      region: "Berlin",
      code: "10115",
      country: "Germany",
    })

    const inputs = wrapper.findAll("input")

    await inputs[0].setValue("New Street 5")

    const emitted = wrapper.emitted("update:modelValue")
    expect(emitted).toBeTruthy()

    const lastValue = emitted.at(-1)[0]

    expect(lastValue).toEqual({
      street: "New Street 5",
      ext: "",
      locality: "Berlin",
      region: "Berlin",
      code: "10115",
      country: "Germany",
    })
  })

  it("emits the changed country", async () => {
    const wrapper = mountAddressEditor({
      street: "",
      ext: "",
      locality: "",
      region: "",
      code: "",
      country: "",
    })

    const inputs = wrapper.findAll("input")

    await inputs[5].setValue("Italy")

    const lastValue = wrapper.emitted("update:modelValue").at(-1)[0]

    expect(lastValue).toEqual({
      street: "",
      ext: "",
      locality: "",
      region: "",
      code: "",
      country: "Italy",
    })
  })

  it("works with an empty address object", () => {
    const wrapper = mountAddressEditor({})

    expect(inputValues(wrapper)).toEqual([
      "",
      "",
      "",
      "",
      "",
      "",
    ])
  })
})
