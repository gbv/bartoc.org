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

// Use a small parent so v-model works like it does in ItemEditor.
function mountEditor({ subjects = [], main = source } = {}) {
  return mount({
    components: { InheritableSubjectsEditor },
    data: () => ({ subjects, main }),
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
  it("starts a whole-field override from read-only inherited subjects", async () => {
    const wrapper = mountEditor()
    const editor = wrapper.getComponent(InheritableSubjectsEditor)

    expect(editor.attributes("data-mode")).toBe("inherited")
    expect(wrapper.get("[data-testid='subject-editor']").text()).toContain("300")
    expect(wrapper.get("[data-testid='subject-editor']").attributes("data-read-only"))
      .toBe("true")

    await wrapper.get("[data-testid='start-override']").trigger("click")

    expect(wrapper.vm.subjects).toEqual(source.subject)
    expect(wrapper.vm.subjects).not.toBe(source.subject)
    expect(wrapper.vm.subjects[0]).not.toBe(source.subject[0])
    expect(editor.attributes("data-mode")).toBe("override")
    expect(wrapper.get("[data-testid='subject-editor']").attributes("data-read-only"))
      .toBe("false")
    expect(source.subject).toEqual([inheritedSubject])
  })

  it("keeps an empty local edit in override mode until the user returns to main", async () => {
    const wrapper = mountEditor()
    const editor = wrapper.getComponent(InheritableSubjectsEditor)

    await wrapper.get("[data-testid='start-override']").trigger("click")
    await wrapper.get("[data-testid='clear-subjects']").trigger("click")

    expect(editor.attributes("data-mode")).toBe("override")
    expect(editor.vm.validationError()).toEqual({
      message: "Select a subject or use the value from the main record.",
    })

    await wrapper.get("[data-testid='use-main']").trigger("click")

    expect(wrapper.vm.subjects).toEqual([])
    expect(editor.attributes("data-mode")).toBe("inherited")
  })

  it("treats any local subject list as a complete override", async () => {
    const localSubject = {
      uri: "http://dewey.info/class/200/",
      inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
    }
    const wrapper = mountEditor({ subjects: [localSubject] })
    const editor = wrapper.getComponent(InheritableSubjectsEditor)

    expect(editor.attributes("data-mode")).toBe("override")
    expect(wrapper.get("[data-testid='subject-editor']").text()).toContain(
      localSubject.uri,
    )
    expect(wrapper.text()).not.toContain("300")

    await wrapper.get("[data-testid='use-main']").trigger("click")

    expect(wrapper.vm.subjects).toEqual([])
    expect(editor.attributes("data-mode")).toBe("inherited")
  })

  it("shows the normal editor when the main record has no subjects", () => {
    const wrapper = mountEditor({
      main: { uri: source.uri, subject: [] },
    })
    const editor = wrapper.getComponent(InheritableSubjectsEditor)

    expect(editor.attributes("data-mode")).toBe("editable")
    expect(wrapper.get("[data-testid='subject-editor']").attributes("data-read-only"))
      .toBe("false")
  })
})
