// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import InheritableTitleEditor from "../../vue/components/InheritableTitleEditor.vue"

const main = {
  uri: "http://bartoc.org/en/node/21136",
  prefLabel: { en: "Main terminology" },
}

const LabelEditorStub = {
  name: "LabelEditor",
  props: ["prefLabel", "altLabel"],
  emits: ["update:prefLabel", "update:altLabel"],
  template: "<div data-testid='label-editor' />",
}

function mountEditor() {
  return mount({
    components: { InheritableTitleEditor },
    data: () => ({
      main,
      prefLabel: {},
      altLabel: {},
      version: "2.0",
    }),
    template: `
      <InheritableTitleEditor
        v-model="prefLabel"
        v-model:alt-label="altLabel"
        :source="main"
        :version="version" />
    `,
  }, {
    global: {
      stubs: { LabelEditor: LabelEditorStub },
    },
  })
}

describe("InheritableTitleEditor", () => {
  it("uses the generated or local title", async () => {
    const wrapper = mountEditor()
    const editor = wrapper.getComponent(InheritableTitleEditor)

    expect(wrapper.get("[data-testid='inherited-title']").text())
      .toContain("Main terminology 2.0")

    await wrapper.get("[data-testid='start-override']").trigger("click")
    expect(wrapper.vm.prefLabel).toEqual({ en: "Main terminology 2.0" })

    const labelEditor = wrapper.getComponent(LabelEditorStub)
    labelEditor.vm.$emit("update:prefLabel", {})
    labelEditor.vm.$emit("update:altLabel", {})
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.prefLabel).toEqual({})
    expect(wrapper.vm.altLabel).toEqual({})
    expect(editor.vm.validationError()).toEqual({
      message: "Enter a title or use the value from the main record.",
    })

    await wrapper.get("[data-testid='use-main']").trigger("click")
    expect(wrapper.vm.prefLabel).toEqual({})
    expect(wrapper.vm.altLabel).toEqual({})
  })
})
