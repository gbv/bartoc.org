// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import InheritableKosTypesEditor from "../../vue/components/InheritableKosTypesEditor.vue"

const conceptSchemeType = "http://www.w3.org/2004/02/skos/core#ConceptScheme"
const thesaurusType = "http://w3id.org/nkos/nkostype#thesaurus"
const ontologyType = "http://w3id.org/nkos/nkostype#ontology"

const kosTypeOptions = [
  { uri: thesaurusType, prefLabel: { en: "Thesaurus" } },
  { uri: ontologyType, prefLabel: { en: "Ontology" } },
]

const mainRecord = {
  uri: "http://bartoc.org/en/node/21136",
  type: [conceptSchemeType, thesaurusType],
}

const ItemNameStub = {
  props: ["item"],
  template: "<span>{{ item.prefLabel?.en || item.uri }}</span>",
}

function mountEditor(main = mainRecord) {
  return mount({
    components: { InheritableKosTypesEditor },
    data: () => ({ localKosTypes: [], main, kosTypeOptions }),
    template: `
      <InheritableKosTypesEditor
        v-model="localKosTypes"
        :source="main"
        :options="kosTypeOptions" />
    `,
  }, {
    global: {
      stubs: { ItemName: ItemNameStub },
    },
  })
}

describe("InheritableKosTypesEditor", () => {
  it("uses main and local KOS types", async () => {
    const wrapper = mountEditor()

    expect(wrapper.get("[data-testid='inherited-kos-types']").text())
      .toBe("Thesaurus")

    await wrapper.get("[data-testid='start-override']").trigger("click")
    expect(wrapper.vm.localKosTypes).toEqual([{ uri: thesaurusType }])

    await wrapper.get("select").setValue([ontologyType])
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
    expect(wrapper.find("select").exists()).toBe(true)
  })
})
