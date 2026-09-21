// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import MediaEditor from "../../vue/components/MediaEditor.vue"

function mountEditor(modelValue = []) {
  return mount(MediaEditor, {
    props: { modelValue },
  })
}

describe("MediaEditor", () => {
  it("adds and validates a thumbnail URL", async () => {
    const wrapper = mountEditor()

    expect(wrapper.find("input").exists()).toBe(false)

    await wrapper.get("button").trigger("click")

    expect(wrapper.emitted("update:modelValue")).toBeUndefined()

    const input = wrapper.get("input")
    await input.setValue("example.org/logo.png")

    expect(input.classes()).toContain("cc-form-control--invalid")

    await input.setValue("https://example.org/logo.png")

    expect(wrapper.emitted("update:modelValue").at(-1)[0]).toEqual([
      { thumbnail: "https://example.org/logo.png" },
    ])
  })
})
