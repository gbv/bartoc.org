// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import InheritableAbstractsEditor from "../../vue/components/InheritableAbstractsEditor.vue"

const source = {
  uri: "http://bartoc.org/en/node/21133",
  prefLabel: { en: "Main terminology" },
  definition: {
    en: ["English definition"],
    de: ["Deutsche Definition"],
  },
}

const AbstractsEditorStub = {
  props: ["modelValue", "requireEnglish"],
  emits: ["update:modelValue"],
  template: `
    <button
      data-testid="clear-definition"
      @click="$emit('update:modelValue', {})">
      clear
    </button>
  `,
}

// Use a small parent so v-model works like it does in ItemEditor.
function mountEditor({ definition = {}, main = source } = {}) {
  return mount({
    components: { InheritableAbstractsEditor },
    data: () => ({ definition, main }),
    template: `
      <InheritableAbstractsEditor
        v-model="definition"
        :source="main" />
    `,
  }, {
    global: {
      stubs: { AbstractsEditor: AbstractsEditorStub },
    },
  })
}

describe("InheritableAbstractsEditor", () => {
  it("switches between inherited definitions and a local override", async () => {
    const wrapper = mountEditor()
    const editor = wrapper.getComponent(InheritableAbstractsEditor)

    expect(editor.attributes("data-mode")).toBe("inherited")
    expect(wrapper.get("[data-testid='inherited-definition']").text()).toContain(
      "English definition",
    )

    await wrapper.get("[data-testid='start-override']").trigger("click")

    expect(wrapper.vm.definition).toEqual(source.definition)
    expect(wrapper.vm.definition).not.toBe(source.definition)
    expect(editor.attributes("data-mode")).toBe("override")

    await wrapper.get("[data-testid='clear-definition']").trigger("click")
    expect(editor.vm.validationError()).toEqual({
      message: "Enter an abstract or use the value from the main record.",
    })

    await wrapper.get("[data-testid='use-main']").trigger("click")

    expect(wrapper.vm.definition).toEqual({})
    expect(editor.attributes("data-mode")).toBe("inherited")
  })

  it("shows the normal editor when the main record has no definition", () => {
    const wrapper = mountEditor({
      main: { uri: source.uri, definition: {} },
    })
    const editor = wrapper.getComponent(InheritableAbstractsEditor)

    expect(editor.attributes("data-mode")).toBe("editable")
    expect(wrapper.get("[data-testid='clear-definition']").exists()).toBe(true)
  })
})
