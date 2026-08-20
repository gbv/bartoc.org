// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import AbbreviationEditor from "../../vue/components/AbbreviationEditor.vue"

const source = {
  uri: "http://bartoc.org/en/node/21133",
  prefLabel: { en: "Main terminology" },
  notation: ["TheSoz"],
}

// Use a small parent so v-model works like it does in ItemEditor.
function mountEditor({ notation = [], main = source } = {}) {
  return mount({
    components: { AbbreviationEditor },
    data: () => ({ notation, main }),
    template: `
      <AbbreviationEditor
        v-model="notation"
        :source="main" />
    `,
  })
}

describe("AbbreviationEditor", () => {
  it("switches between the inherited value and a local override", async () => {
    const wrapper = mountEditor()
    const editor = wrapper.getComponent(AbbreviationEditor)

    expect(editor.attributes("data-mode")).toBe("inherited")
    expect(wrapper.get("[data-testid='inherited-notation']").text()).toBe("TheSoz")

    await wrapper.get("[data-testid='start-override']").trigger("click")

    expect(wrapper.vm.notation).toEqual(["TheSoz"])
    expect(wrapper.vm.notation).not.toBe(source.notation)
    expect(editor.attributes("data-mode")).toBe("override")

    await wrapper.get("[data-testid='notation-editor']").setValue("")

    expect(editor.vm.validationError()).toEqual({
      message: "Enter an abbreviation or use the value from the main record.",
    })

    await wrapper.get("[data-testid='use-main']").trigger("click")

    expect(wrapper.vm.notation).toEqual([])
    expect(editor.attributes("data-mode")).toBe("inherited")
    expect(source.notation).toEqual(["TheSoz"])
  })

  it("shows a normal editor when the main record has no abbreviation", () => {
    const wrapper = mountEditor({
      main: { uri: source.uri, notation: [] },
    })
    const editor = wrapper.getComponent(AbbreviationEditor)

    expect(editor.attributes("data-mode")).toBe("editable")
    expect(wrapper.get("[data-testid='notation-editor']").exists()).toBe(true)
  })
})
