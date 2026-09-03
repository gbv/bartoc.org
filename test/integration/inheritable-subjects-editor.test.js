// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import InheritableSubjectsEditor from "../../vue/components/InheritableSubjectsEditor.vue"

const inheritedSubject = {
  uri: "http://dewey.info/class/300/",
  notation: ["300"],
  prefLabel: { en: "Social sciences" },
  inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
}

const source = {
  uri: "http://bartoc.org/en/node/21133",
  prefLabel: { en: "Main terminology" },
  subject: [inheritedSubject],
}

const SubjectEditorStub = {
  props: {
    modelValue: Array,
    readOnly: Boolean,
  },
  emits: ["update:modelValue"],
  template: `
    <div
      data-testid="subject-editor"
      :data-read-only="String(readOnly)">
      {{ modelValue.map(subject => subject.notation?.[0] || subject.uri).join(", ") }}
      <button
        v-if="!readOnly"
        data-testid="clear-subjects"
        @click="$emit('update:modelValue', [])">
        clear
      </button>
    </div>
  `,
}

function mountEditor() {
  return mount({
    components: { InheritableSubjectsEditor },
    data: () => ({ subjects: [], main: source }),
    template: `
      <InheritableSubjectsEditor
        v-model="subjects"
        :source="main" />
    `,
  }, {
    global: {
      stubs: { SubjectEditor: SubjectEditorStub },
    },
  })
}

describe("InheritableSubjectsEditor", () => {
  it("uses the main or local subjects", async () => {
    const wrapper = mountEditor()
    const editor = wrapper.getComponent(InheritableSubjectsEditor)

    expect(wrapper.get("[data-testid='subject-editor']").text()).toContain("300")
    expect(wrapper.get("[data-testid='subject-editor']").attributes("data-read-only"))
      .toBe("true")

    await wrapper.get("[data-testid='start-override']").trigger("click")

    expect(wrapper.vm.subjects).toEqual(source.subject)
    expect(wrapper.get("[data-testid='subject-editor']").attributes("data-read-only"))
      .toBe("false")

    await wrapper.get("[data-testid='clear-subjects']").trigger("click")

    expect(editor.vm.validationError()).toEqual({
      message: "Select a subject or use the value from the main record.",
    })

    await wrapper.get("[data-testid='use-main']").trigger("click")

    expect(wrapper.vm.subjects).toEqual([])
  })
})
