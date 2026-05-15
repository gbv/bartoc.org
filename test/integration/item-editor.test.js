// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"
import { nextTick } from "vue"
import ItemEditor from "../../vue/components/ItemEditor.vue"

const utilsMocks = vi.hoisted(() => ({
  loadConcepts: vi.fn(() => Promise.resolve([])),
  trimItemIdentifiers: vi.fn(),
  createConceptApiProvider: vi.fn(() => ({
    loadTop: () => Promise.resolve([]),
    loadSelected: () => Promise.resolve([]),
    search: () => Promise.resolve(["", [], [], []]),
    loadNarrower: () => Promise.resolve(),
    toModel: (items) => items,
  })),
}))

vi.mock("../../vue/utils.js", async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    loadConcepts: utilsMocks.loadConcepts,
    trimItemIdentifiers: utilsMocks.trimItemIdentifiers,
    createConceptApiProvider: utilsMocks.createConceptApiProvider,
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
  props: {
    modelValue: Object,
    requireEnglish: Boolean,
  },
  emits: ["update:modelValue"],
  template: `
    <div data-testid="abstracts-editor">
      <pre data-testid="definition">{{ JSON.stringify(modelValue) }}</pre>
      <pre data-testid="require-english">{{ JSON.stringify(requireEnglish) }}</pre>

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

const conceptSchemeType = "http://www.w3.org/2004/02/skos/core#ConceptScheme"

function mountEditor(current = {}, props = {}) {
  return mount(ItemEditor, {
    props: {
      current,
      user: null,
      auth: null,
      ...props,
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
  beforeEach(() => {
    utilsMocks.loadConcepts.mockClear()
    utilsMocks.trimItemIdentifiers.mockClear()
    utilsMocks.createConceptApiProvider.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("initializes missing object and array fields", () => {
    const w = mountEditor({
      notationExamples: ["A", "B"],
      prefLabel: { en: ["x"] },
      definition: { en: ["English abstract"] },
      type: [conceptSchemeType],
    })

    expect(w.vm.item.ADDRESS).toEqual({})
    expect(w.vm.item.DISPLAY).toEqual({})
    expect(w.vm.item.notation).toEqual([])
    expect(w.vm.item.identifier).toEqual([])
    expect(w.vm.item.languages).toEqual([])
    expect(w.vm.item.subjectOf).toEqual([])
    expect(w.vm.item.versionOf).toEqual([])
    expect(w.vm.examples).toBe("A, B")
  })

  it("loads supporting concept lists on mount", async () => {
    mountEditor({
      prefLabel: { en: ["x"] },
      definition: { en: ["English abstract"] },
      type: [conceptSchemeType],
    })
    await flushPromises()

    expect(utilsMocks.loadConcepts).toHaveBeenCalledWith(
      "https://api.dante.gbv.de/voc/top",
      "http://uri.gbv.de/terminology/license/",
    )
    expect(utilsMocks.loadConcepts).toHaveBeenCalledWith(
      "/api/voc/top",
      "http://w3id.org/nkos/nkostype",
    )
    expect(utilsMocks.loadConcepts).toHaveBeenCalledWith(
      "/api/voc/top",
      "http://bartoc.org/en/node/20000",
    )
    expect(utilsMocks.loadConcepts).toHaveBeenCalledWith(
      "/api/voc/top",
      "http://bartoc.org/en/node/20001",
    )
    expect(utilsMocks.loadConcepts).toHaveBeenCalledWith("/registries?format=jskos")
  })

  it("updates notation examples from the comma-separated input value", async () => {
    const w = mountEditor({
      prefLabel: { en: ["x"] },
      definition: { en: ["English abstract"] },
      type: [conceptSchemeType],
    })

    w.vm.examples = "A, B, , C"
    await nextTick()

    expect(w.vm.item.notationExamples).toEqual(["A", "B", "C"])
  })

  it("passes item.definition to AbstractsEditor", () => {
    const w = mountEditor({
      definition: {
        en: ["English text"],
        und: ["Undetermined text"],
      },
      prefLabel: { en: ["x"] },
      type: [conceptSchemeType],
    })

    expect(w.get("[data-testid='definition']").text()).toBe(
      JSON.stringify({
        en: ["English text"],
        und: ["Undetermined text"],
      }),
    )
  })

  it("requires an English abstract for new items", () => {
    const w = mountEditor({
      definition: {},
      prefLabel: { en: ["x"] },
      type: [conceptSchemeType],
    })

    expect(w.get("[data-testid='require-english']").text()).toBe("true")
  })

  it("requires an English abstract for existing items", () => {
    const w = mountEditor({
      uri: "http://bartoc.org/en/node/12345",
      definition: {},
      prefLabel: { en: ["x"] },
      type: [conceptSchemeType],
    })

    expect(w.get("[data-testid='require-english']").text()).toBe("true")
  })

  it("updates item.definition when AbstractsEditor emits a new value", async () => {
    const w = mountEditor({
      definition: {},
      prefLabel: { en: ["x"] },
      type: [conceptSchemeType],
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
      type: [conceptSchemeType],
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
      type: [conceptSchemeType],
    })

    await w.get("[data-testid='emit-en']").trigger("click")

    expect(w.vm.itemError()).toBeUndefined()
  })

  it("jskosPreview includes the updated definition", async () => {
    const w = mountEditor({
      definition: {},
      prefLabel: { en: ["x"] },
      type: [conceptSchemeType],
    })

    await w.get("[data-testid='emit-en-it']").trigger("click")

    const preview = JSON.parse(w.vm.jskosPreview)
    expect(preview.definition).toEqual({
      en: ["English abstract"],
      it: ["Abstract italiano"],
    })
  })

  it("cleans empty fields and normalizes relation-like values", () => {
    const w = mountEditor({
      prefLabel: { en: ["x"] },
      definition: { en: ["English abstract"] },
      type: [],
    })

    const cleaned = w.vm.cleanupItem({
      type: [],
      API: [
        { url: "", type: "http://bartoc.org/api-type/webservice" },
        { url: "https://example.org/api", type: "http://bartoc.org/api-type/jskos" },
      ],
      subject: [
        {
          uri: "subject:1",
          inScheme: [{ uri: "scheme:1", prefLabel: { en: "Scheme" } }],
          notation: ["1"],
          prefLabel: { en: "Subject" },
        },
      ],
      definition: {
        "": ["remove me"],
        en: ["English abstract"],
      },
      versionOf: [
        { uri: "" },
        { uri: "vocabulary:previous", prefLabel: { en: "Previous" } },
      ],
      basedOn: [
        { uri: "vocabulary:base", prefLabel: { en: "Base" } },
      ],
      _private: "hidden",
    })

    expect(cleaned).toEqual({
      type: [conceptSchemeType],
      API: [
        { type: "http://bartoc.org/api-type/jskos", url: "https://example.org/api" },
      ],
      subject: [
        {
          uri: "subject:1",
          inScheme: [{ uri: "scheme:1" }],
          notation: ["1"],
        },
      ],
      definition: {
        en: ["English abstract"],
      },
      versionOf: [
        { uri: "vocabulary:previous" },
      ],
      basedOn: [
        { uri: "vocabulary:base" },
      ],
    })
  })

  it("saves an existing item with cleaned JSON and auth headers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ message: "Save failed" }),
      })),
    )

    const w = mountEditor(
      {
        uri: "http://bartoc.org/en/node/123",
        prefLabel: { en: ["Title"] },
        definition: { en: ["English abstract"] },
        type: [conceptSchemeType],
        API: [
          { url: "https://example.org/api", type: "http://bartoc.org/api-type/jskos" },
          { url: "", type: "http://bartoc.org/api-type/webservice" },
        ],
      },
      {
        auth: { token: "token-123" },
      },
    )

    await w.vm.saveItem()
    await flushPromises()

    expect(fetch).toHaveBeenCalledWith(
      "/api/voc",
      expect.objectContaining({
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-123",
        },
      }),
    )

    const [, options] = fetch.mock.calls.at(-1)
    expect(JSON.parse(options.body)).toMatchObject({
      uri: "http://bartoc.org/en/node/123",
      prefLabel: { en: ["Title"] },
      definition: { en: ["English abstract"] },
      API: [
        { type: "http://bartoc.org/api-type/jskos", url: "https://example.org/api" },
      ],
    })
    expect(utilsMocks.trimItemIdentifiers).toHaveBeenCalled()
    expect(w.vm.error).toMatchObject({
      status: 500,
      message: "Save failed",
    })
  })
})
