// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import ItemLabels from "../../vue/components/ItemLabels.vue"

function mountItemLabels(item) {
  return mount(ItemLabels, {
    props: { item },
  })
}

describe("ItemLabels", () => {
  it("renders preferred, alternate, and hidden labels with language tags", () => {
    const wrapper = mountItemLabels({
      prefLabel: { en: "Preferred label" },
      altLabel: { en: ["Alternate label"], de: ["Alternativer Name"] },
      hiddenLabel: { fr: ["Libelle cache"] },
    })

    const labels = wrapper.findAll(".language-tag")

    expect(labels.map(label => label.text())).toEqual([
      "Preferred label",
      "Alternate label",
      "Alternativer Name",
      "Libelle cache",
    ])
    expect(labels.map(label => label.attributes("lang"))).toEqual([
      "en",
      "en",
      "de",
      "fr",
    ])
  })
})
