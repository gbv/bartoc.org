// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import InheritableNotationExamplesEditor from "../../vue/components/InheritableNotationExamplesEditor.vue"

const mainRecord = {
  uri: "http://bartoc.org/en/node/21136",
  notationExamples: ["A100", "B200"],
}

function mountEditor() {
  return mount({
    components: { InheritableNotationExamplesEditor },
    data: () => ({ examples: [], mainRecord }),
    template: `
      <InheritableNotationExamplesEditor
        v-model="examples"
        :source="mainRecord" />
    `,
  })
}

describe("InheritableNotationExamplesEditor", () => {
  it("uses main or local examples", async () => {
    const wrapper = mountEditor()
    const editor = wrapper.getComponent(InheritableNotationExamplesEditor)

    expect(wrapper.get("[data-testid='inherited-notation-examples']").text())
      .toBe("A100, B200")

    await wrapper.get("[data-testid='start-override']").trigger("click")
    expect(wrapper.vm.examples).toEqual(["A100", "B200"])
    expect(wrapper.get("[data-testid='notation-examples-editor']").element.value)
      .toBe("A100, B200")

    await wrapper.get("[data-testid='notation-examples-editor']").setValue("")
    expect(editor.vm.validationError()).toEqual({
      message: "Enter an example notation or use the value from the main record.",
    })

    await wrapper.get("[data-testid='use-main']").trigger("click")
    expect(wrapper.vm.examples).toEqual([])
    expect(wrapper.get("[data-testid='inherited-notation-examples']").text())
      .toBe("A100, B200")
  })
})
