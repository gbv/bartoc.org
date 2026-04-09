// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import PublisherEditor from "../../vue/components/PublisherEditor.vue"

function mountEditor(modelValue = []) {
  return mount(PublisherEditor, {
    props: {
      modelValue,
    },
  })
}

describe("PublisherEditor", () => {
  it("shows initial values from modelValue", () => {
    const wrapper = mountEditor([
      {
        uri: "https://viaf.org/viaf/1234",
        prefLabel: { en: "Test Publisher" },
      },
    ])

    const inputs = wrapper.findAll("input")
    expect(inputs[0].element.value).toBe("Test Publisher")
    expect(inputs[1].element.value).toBe("https://viaf.org/viaf/1234")
  })

  it("emits updated value when name and uri change", async () => {
    const wrapper = mountEditor()

    const inputs = wrapper.findAll("input")
    await inputs[0].setValue("My Publisher")
    await inputs[1].setValue("https://example.org/publisher")

    const emitted = wrapper.emitted("update:modelValue")
    expect(emitted).toBeTruthy()

    expect(emitted.at(-1)).toEqual([
      [
        {
          uri: "https://example.org/publisher",
          prefLabel: { en: "My Publisher" },
        },
      ],
    ])
  })

  it("emits empty array when both fields are empty", async () => {
    const wrapper = mountEditor([
      {
        uri: "https://example.org/publisher",
        prefLabel: { en: "Old Publisher" },
      },
    ])

    const inputs = wrapper.findAll("input")
    await inputs[0].setValue("")
    await inputs[1].setValue("")

    expect(wrapper.emitted("update:modelValue").at(-1)).toEqual([[]])
  })

  it("marks invalid uri", async () => {
    const wrapper = mountEditor()
    const uriInput = wrapper.findAll("input")[1]

    await uriInput.setValue("not-a-url")

    expect(uriInput.classes()).toContain("is-invalid")
  })

})
