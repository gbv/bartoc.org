// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import AbbreviationEditor from "../../vue/components/AbbreviationEditor.vue"

const source = {
  uri: "http://bartoc.org/en/node/21133",
  prefLabel: { en: "Main terminology" },
  notation: ["TheSoz"],
}

function mountEditor() {
  return mount({
    components: { AbbreviationEditor },
    data: () => ({ notation: [], main: source }),
    template: `
      <AbbreviationEditor
        v-model="notation"
        :source="main" />
    `,
  })
}

describe("AbbreviationEditor", () => {
  it("uses the main or local abbreviation", async () => {
    const wrapper = mountEditor()
    const editor = wrapper.getComponent(AbbreviationEditor)

    expect(wrapper.get("[data-testid='inherited-notation']").text()).toBe("TheSoz")

    await wrapper.get("[data-testid='start-override']").trigger("click")

    expect(wrapper.vm.notation).toEqual(["TheSoz"])

    await wrapper.get("[data-testid='notation-editor']").setValue("")

    expect(editor.vm.validationError()).toEqual({
      message: "Enter an abbreviation or use the value from the main record.",
    })

    await wrapper.get("[data-testid='use-main']").trigger("click")

    expect(wrapper.vm.notation).toEqual([])
  })
})
