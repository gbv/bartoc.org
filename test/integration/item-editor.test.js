// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import ItemEditor from "../../vue/components/ItemEditor.vue"

vi.mock("../../vue/utils.js", async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    loadConcepts: () => Promise.resolve([]),
    trimItemIdentifiers: vi.fn(),
    createConceptApiProvider: vi.fn(() => ({
      loadTop: () => Promise.resolve([]),
      loadSelected: () => Promise.resolve([]),
      search: () => Promise.resolve(["", [], [], []]),
      loadNarrower: () => Promise.resolve(),
      toModel: (items) => items,
    })),
  }
})

const FormRowStub = {
  props: ["label"],
  template: `
    <div class="form-row">
      <label v-if="label">{{ label }}</label>
      <slot />
    </div>
  `,
}

const AbstractsEditorStub = {
  props: ["modelValue"],
  emits: ["update:modelValue"],
  template: `
    <div data-testid="abstracts-editor">
      <pre data-testid="definition">{{ JSON.stringify(modelValue) }}</pre>

      <button
        data-testid="emit-en"
        @click="$emit('update:modelValue', { en: ['English abstract'] })">
        emit en
      </button>

      <button
        data-testid="emit-en-it"
        @click="$emit('update:modelValue', {
          en: ['English abstract'],
          it: ['Abstract italiano']
        })">
        emit en+it
      </button>

      <button
        data-testid="emit-no-en"
        @click="$emit('update:modelValue', {
          it: ['Solo italiano']
        })">
        emit no en
      </button>
    </div>
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
        AbstractsEditor: AbstractsEditorStub,
        LabelEditor: true,
        LanguageSelect: true,
        ListEditor: true,
        SubjectEditor: true,
        SetSelect: true,
        AddressEditor: true,
        EndpointsEditor: true,
        ItemSelect: true,
        ItemSelected: true,
      },
    },
  })
}

describe("ItemEditor abstracts", () => {
  it("passes item.definition to AbstractsEditor", () => {
    const w = mountEditor({
      definition: {
        en: ["English text"],
        und: ["Undetermined text"],
      },
      prefLabel: { en: ["x"] },
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
    })

    expect(w.get("[data-testid='definition']").text()).toBe(
      JSON.stringify({
        en: ["English text"],
        und: ["Undetermined text"],
      }),
    )
  })

  it("updates item.definition when AbstractsEditor emits a new value", async () => {
    const w = mountEditor({
      definition: {},
      prefLabel: { en: ["x"] },
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
    })

    await w.get("[data-testid='emit-en-it']").trigger("click")

    expect(w.vm.item.definition).toEqual({
      en: ["English abstract"],
      it: ["Abstract italiano"],
    })
  })

  it("itemError requires at least one English abstract", async () => {
    const w = mountEditor({
      definition: {},
      prefLabel: { en: ["x"] },
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
    })

    await w.get("[data-testid='emit-no-en']").trigger("click")

    expect(w.vm.itemError()).toEqual({
      message: "Please provide at least one English abstract.",
    })
  })

  it("itemError is ok when there is an English abstract", async () => {
    const w = mountEditor({
      definition: {},
      prefLabel: { en: ["x"] },
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
    })

    await w.get("[data-testid='emit-en']").trigger("click")

    expect(w.vm.itemError()).toBeUndefined()
  })

  it("jskosPreview includes the updated definition", async () => {
    const w = mountEditor({
      definition: {},
      prefLabel: { en: ["x"] },
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
    })

    await w.get("[data-testid='emit-en-it']").trigger("click")

    const preview = JSON.parse(w.vm.jskosPreview)
    expect(preview.definition).toEqual({
      en: ["English abstract"],
      it: ["Abstract italiano"],
    })
  })
})
