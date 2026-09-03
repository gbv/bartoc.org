// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import InheritableLanguagesEditor from "../../vue/components/InheritableLanguagesEditor.vue"

const source = {
  uri: "http://bartoc.org/en/node/21136",
  prefLabel: { en: "main-21-08" },
  languages: ["gsw", "eo"],
}

const LanguageSelectStub = {
  name: "LanguageSelect",
  props: ["modelValue", "repeatable", "disabled"],
  emits: ["update:modelValue"],
  template: `
    <div data-testid="language-select">
      <button
        v-if="!disabled"
        data-testid="clear-languages"
        @click="$emit('update:modelValue', [])">
        clear
      </button>
    </div>
  `,
}

function mountEditor() {
  return mount({
    components: { InheritableLanguagesEditor },
    data: () => ({ languages: [], main: source }),
    template: `
      <InheritableLanguagesEditor
        v-model="languages"
        :source="main" />
    `,
  }, {
    global: {
      stubs: { LanguageSelect: LanguageSelectStub },
    },
  })
}

describe("InheritableLanguagesEditor", () => {
  it("uses the main or local languages", async () => {
    const wrapper = mountEditor()
    const editor = wrapper.getComponent(InheritableLanguagesEditor)

    const inheritedSelect = wrapper.getComponent({ name: "LanguageSelect" })
    expect(inheritedSelect.props("modelValue")).toEqual(["gsw", "eo"])
    expect(inheritedSelect.props("disabled")).toBe(true)

    await wrapper.get("[data-testid='start-override']").trigger("click")

    expect(wrapper.vm.languages).toEqual(source.languages)

    await wrapper.get("[data-testid='clear-languages']").trigger("click")
    expect(editor.vm.validationError()).toEqual({
      message: "Select a language or use the value from the main record.",
    })

    await wrapper.get("[data-testid='use-main']").trigger("click")

    expect(wrapper.vm.languages).toEqual([])
  })
})
