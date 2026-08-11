// @vitest-environment jsdom
import { defineComponent, h, nextTick, ref } from "vue"
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import TerminologyPage from "../../vue/pages/TerminologyPage.vue"

const selectConcept = vi.fn()
const ConceptBrowserStub = defineComponent({
  name: "ConceptBrowser",
  setup(_, { expose }) {
    expose({ selectConcept })
    return () => h("div", { "data-testid": "concept-browser" })
  },
})
const ServiceLinkStub = {
  name: "ServiceLink",
  props: ["endpoint"],
  template: "<a :href=\"endpoint.url\">{{ endpoint.url }}</a>",
}

const typeUri = "http://w3id.org/nkos/nkostype#thesaurus"
const item = {
  uri: "http://bartoc.org/en/node/123",
  prefLabel: { en: "Test Vocabulary", de: "Testvokabular" },
  altLabel: { en: ["Test Thesaurus"] },
  definition: { en: ["First paragraph\nSecond paragraph"] },
  type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme", typeUri],
  notation: ["TEST"],
  subject: [
    {
      uri: "http://bartoc.org/en/node/100",
      prefLabel: { en: "Manual Subject" },
      notation: ["100"],
    },
    {
      uri: "http://bartoc.org/en/node/200",
      prefLabel: { en: "Derived Subject" },
      notation: ["200"],
      MAPPING: [{ uri: "mapping:1" }],
    },
  ],
  versionOf: [{
    uri: "http://bartoc.org/en/node/122",
    prefLabel: { en: "Earlier Version" },
    startDate: "2020",
    extent: "100 concepts",
  }],
  _versionOfBacklink: [{
    uri: "http://bartoc.org/en/node/124",
    prefLabel: { en: "Later Version" },
  }],
  basedOn: [{
    uri: "http://bartoc.org/en/node/300",
    prefLabel: { en: "Base Terminology" },
  }],
  _basedOnBacklink: [{
    uri: "http://bartoc.org/en/node/400",
    prefLabel: { en: "Derived Terminology" },
  }],
  ACCESS: [{ uri: "http://bartoc.org/en/Access/Free" }],
  FORMAT: [{ uri: "http://bartoc.org/en/Format/Online" }],
  license: [{
    uri: "https://example.org/license",
    prefLabel: { en: "Example License" },
  }],
  languages: ["en", "de"],
  ADDRESS: { street: "Example Street", locality: "Berlin", country: "Germany" },
  API: [{ url: "https://example.org/api", type: "jskos" }],
  extent: "123 concepts",
  identifier: ["TEST", "https://example.org/id"],
  namespace: "https://example.org/concepts/",
  notationPattern: "[A-Z]+",
}

function mountPage(itemOverrides = {}) {
  return mount(TerminologyPage, {
    props: {
      title: "Test Vocabulary",
      item: { ...item, ...itemOverrides },
      nkosTypes: {
        [typeUri]: { uri: typeUri, prefLabel: { en: "Thesaurus" } },
      },
      accessTypes: {
        "http://bartoc.org/en/Access/Free": {
          uri: "http://bartoc.org/en/Access/Free",
          prefLabel: { en: "freely available" },
        },
      },
      formats: {
        "http://bartoc.org/en/Format/Online": {
          uri: "http://bartoc.org/en/Format/Online",
          prefLabel: { en: "Online" },
        },
      },
    },
    global: {
      provide: {
        header: { userCanAdd: ref(true) },
      },
      stubs: {
        ConceptBrowser: ConceptBrowserStub,
        ServiceLink: ServiceLinkStub,
      },
    },
  })
}

function rowByLabel(wrapper, label) {
  return wrapper.findAll("tr").find(row => row.findAll("td")[0]?.text().trim() === label)
}

describe("TerminologyPage", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/en/node/123")
    selectConcept.mockClear()
  })

  it("renders abstracts, subjects and terminology relations", () => {
    const wrapper = mountPage()

    expect(wrapper.get("h1").text()).toBe("Test Vocabulary")
    expect(wrapper.get("a[href='/edit?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123']").text()).toBe("edit")
    expect(wrapper.findAll("p").map(paragraph => paragraph.text())).toEqual([
      "First paragraph",
      "Second paragraph",
    ])
    expect(wrapper.find(".virtual-abstract").exists()).toBe(false)
    expect(rowByLabel(wrapper, "Subject").text()).toContain("Manual Subject (100)")
    expect(rowByLabel(wrapper, "Subject").text()).not.toContain("Derived Subject")
    expect(rowByLabel(wrapper, "Subject").get("ul").classes()).toContain("list-inline")
    expect(rowByLabel(wrapper, "Derived Subjects").text()).toContain("Derived Subject (200)")
    expect(rowByLabel(wrapper, "Version of").text()).toContain("Earlier Version (122) · since 2020 · 100 concepts")
    expect(rowByLabel(wrapper, "Versions").text()).toContain("Later Version")
    expect(rowByLabel(wrapper, "Based on").text()).toContain("Base Terminology")
    expect(rowByLabel(wrapper, "Derived terminologies").text()).toContain("Derived Terminology")
  })

  it.each([
    [
      "the preferred title",
      {
        uri: "http://bartoc.org/en/node/122",
        prefLabel: { en: "Earlier Version" },
        startDate: "2020",
        extent: "100 concepts",
      },
      "Earlier Version",
    ],
    [
      "the URI fallback",
      { uri: "http://bartoc.org/en/node/122" },
      "http://bartoc.org/en/node/122",
    ],
  ])("shows a virtual abstract using %s", (_, version, expectedLabel) => {
    const wrapper = mountPage({
      definition: { de: ["Deutsche Zusammenfassung"] },
      versionOf: [version],
    })

    const virtualAbstract = wrapper.get(".virtual-abstract")
    expect(virtualAbstract.text()).toBe(`Version of ${expectedLabel}.`)
    expect(virtualAbstract.get("a").attributes("href")).toBe("/en/node/122")
    expect(wrapper.text()).toContain("Deutsche Zusammenfassung")
    expect(rowByLabel(wrapper, "Version of").text()).toContain(expectedLabel)
  })

  it("selects tabs from the hash and updates it on tab changes", async () => {
    window.history.replaceState({}, "", "/en/node/123#identifiers")
    const wrapper = mountPage()
    await nextTick()

    const headers = wrapper.findAll(".jskos-vue-tabs-header-item")
    expect(headers[3].classes()).toContain("jskos-vue-tabs-header-item-active")

    await headers[1].trigger("click")
    expect(window.location.hash).toBe("#access")
    expect(rowByLabel(wrapper, "Access").text()).toContain("freely available")
    expect(selectConcept).toHaveBeenCalledWith(null)

    await headers[2].trigger("click")
    expect(window.location.hash).toBe("#content")
    expect(wrapper.get("[data-testid='concept-browser']").exists()).toBe(true)
  })
})
