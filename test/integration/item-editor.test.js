// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import ItemEditor from "../../vue/components/ItemEditor.vue"

// mock loadConcepts so created() doesn’t hit network
vi.mock("../../vue/utils.js", async (orig) => {
  const mod = await orig()
  return {
    ...mod,
    loadConcepts: () => Promise.resolve([]),
  }
})

// super-dumb stubs
const FormRowStub = {
  template: "<div class=\"form-row\"><slot /></div>",
}
const LanguageSelectStub = {
  props: ["modelValue", "repeatable"],
  emits: ["update:modelValue"],
  template: `
    <select
      data-testid="lang"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)">
      <option value="">(none)</option>
      <option value="de">de</option>
      <option value="und">und</option>
    </select>
  `,
}

function mountEditor(current = {}) {
  return mount(ItemEditor, {
    props: {
      current,
      user: null,
      auth: null,
    },
    global: {
      stubs: {
        FormRow: FormRowStub,
        // only stub what the test touches
        LanguageSelect: LanguageSelectStub,
        LabelEditor: true,
        ListEditor: true,
        SubjectEditor: true,
        SetSelect: true,
        AddressEditor: true,
        EndpointsEditor: true,
      },
    },
  })
}

describe("ItemEditor non-English abstract", () => {
  it("loads non-English with undetermined language abstract from definition on mount", async () => {
    const w = mountEditor({
      definition: {
        en: ["English text"],
        de: ["Deutsch text"],
        und: ["Undetermined text"],
      },
      prefLabel: { en: ["x"] },
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
    })

    // textarea is the one with id="abstract" in template
    const textArea = w.find("#abstract")
    expect(textArea.exists()).toBe(true)
    expect(textArea.element.value).toBe("Undetermined text")

    const sel = w.find("[data-testid=\"lang\"]")
    expect(sel.element.value).toBe("und")
  })

  it("updates item.definition[lang] when typing and language is selected", async () => {
    const w = mountEditor({
      definition: { en: ["English text"], de: ["Deutsch text"] },
      prefLabel: { en: ["x"] },
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
    })

    const textArea = w.find("#abstract")
    await textArea.setValue("New Deutsch text")

    const selectedLanguage = w.find("[data-testid=\"lang\"]")
    await selectedLanguage.setValue("de")

    // component keeps the whole item in its internal state
    expect(w.vm.item.definition.de).toEqual(["New Deutsch text"])
  })

  it("it does not update item.definition[lang] when typing and language is NOT selected", async () => {
    const w = mountEditor({
      definition: { en: ["English text"], de: ["Deutsch text"] },
      prefLabel: { en: ["x"] },
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
    })

    const textArea = w.find("#abstract")
    await textArea.setValue("New Deutsch text")

    // component keeps the whole item in its internal state
    expect(w.vm.item.definition.de).toEqual(["Deutsch text"])
  })


  it("moves text when changing language (de -> und)", async () => {
    const w = mountEditor({
      definition: { en: ["English text"], de: ["Deutsch text"] },
      prefLabel: { en: ["x"] },
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
    })

    const textArea = w.find("#abstract")
    await textArea.setValue("New Undetermined text")

    const selectedLanguage = w.find("[data-testid=\"lang\"]")
    await selectedLanguage.setValue("und")

    // old key deleted, new key set
    expect(w.vm.item.definition.und).toEqual(["New Undetermined text"])
  })

  it("does not create definition[''] when no language is selected", async () => {
    const w = mountEditor({
      definition: { en: ["E"] },
      prefLabel: { en: ["x"] },
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
    })

    // simulate user typing while language is empty
    const sel = w.find("[data-testid=\"lang\"]")
    await sel.setValue("") // (none)

    const ta = w.find("#abstract")
    await ta.setValue("Some text")

    expect(w.vm.item.definition[""]).toBeUndefined()
    expect(Object.keys(w.vm.item.definition)).toEqual(["en"])
  })
})
