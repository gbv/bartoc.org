// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import InheritableKosTypesEditor from "../../vue/components/InheritableKosTypesEditor.vue"

const conceptSchemeType = "http://www.w3.org/2004/02/skos/core#ConceptScheme"
const thesaurusType = "http://w3id.org/nkos/nkostype#thesaurus"
const ontologyType = "http://w3id.org/nkos/nkostype#ontology"

const mainRecord = {
  uri: "http://bartoc.org/en/node/21136",
  type: [conceptSchemeType, thesaurusType],
}

const JskosItemPickerStub = {
  name: "JskosItemPicker",
  props: {
    modelValue: Array,
    provider: Object,
    readonly: Boolean,
    placeholder: String,
  },
  emits: ["update:modelValue"],
  template: "<div data-testid='kos-type-picker' />",
}

const provider = {}

function mountEditor(main = mainRecord) {
  return mount({
    components: { InheritableKosTypesEditor },
    data: () => ({ localKosTypes: [], main, provider }),
    template: `
      <InheritableKosTypesEditor
        v-model="localKosTypes"
        :source="main"
        :provider="provider" />
    `,
  }, {
    global: {
      stubs: { JskosItemPicker: JskosItemPickerStub },
    },
  })
}

describe("InheritableKosTypesEditor", () => {
  it("uses main and local KOS types", async () => {
    const wrapper = mountEditor()
    let picker = wrapper.getComponent(JskosItemPickerStub)

    expect(picker.props("modelValue")).toEqual([{ uri: thesaurusType }])
    expect(picker.props("readonly")).toBe(true)

    await wrapper.get("[data-testid='start-override']").trigger("click")
    expect(wrapper.vm.localKosTypes).toEqual([{ uri: thesaurusType }])

    picker = wrapper.getComponent(JskosItemPickerStub)
    picker.vm.$emit("update:modelValue", [{ uri: ontologyType }])
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.localKosTypes).toEqual([{ uri: ontologyType }])

    await wrapper.get("[data-testid='use-main']").trigger("click")
    expect(wrapper.vm.localKosTypes).toEqual([])
  })

  it("does not inherit ConceptScheme", () => {
    const wrapper = mountEditor({
      uri: mainRecord.uri,
      type: [conceptSchemeType],
    })

    expect(wrapper.find("[data-testid='start-override']").exists()).toBe(false)
    expect(wrapper.getComponent(JskosItemPickerStub).props("readonly")).toBe(false)
  })
})
