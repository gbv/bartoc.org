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
      prefLabel: { en: "Mapped Subject" },
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

function mountPage(itemOverrides = {}, derivedFields = {}) {
  return mount(TerminologyPage, {
    props: {
      title: "Test Vocabulary",
      item: { ...item, ...itemOverrides },
      derivedFields,
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
    const editAction = wrapper.get(
      "a[href='/edit?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123']",
    )
    expect(editAction.text()).toBe("edit")
    expect(editAction.classes()).toContain("page-action")
    expect(wrapper.findAll("p").map(paragraph => paragraph.text())).toEqual([
      "This is a version of Earlier Version.",
      "First paragraph",
      "Second paragraph",
    ])
    expect(wrapper.find("[data-testid='version-inheritance-legend']").exists()).toBe(false)
    expect(wrapper.get("[data-testid='version-context'] a").attributes("href")).toBe(
      "/en/node/122",
    )
    expect(rowByLabel(wrapper, "Subject").text()).toContain("Manual Subject (100)")
    expect(rowByLabel(wrapper, "Subject").text()).not.toContain("Mapped Subject")
    expect(rowByLabel(wrapper, "Subject").get("ul").classes()).toContain("separated-list")
    expect(rowByLabel(wrapper, "Identifiers").get("ul").classes()).toEqual(["metadata-list"])
    expect(rowByLabel(wrapper, "Mapped Subjects").text()).toContain("Mapped Subject (200)")
    expect(rowByLabel(wrapper, "Version of")).toBeUndefined()
    expect(rowByLabel(wrapper, "Versions")).toBeUndefined()
    expect(wrapper.get(".terminology-versions").text()).toContain(
      "Later Version BARTOC ID 124",
    )
    expect(rowByLabel(wrapper, "Based on").text()).toContain("Base Terminology")
    expect(rowByLabel(wrapper, "Derived terminologies").text()).toContain("Derived Terminology")
  })

  it("marks inherited fields and explains them once", () => {
    const source = { from: "http://bartoc.org/en/node/122" }
    const wrapper = mountPage({}, {
      definition: source,
      type: source,
    })

    expect(wrapper.get("[data-testid='version-inheritance-legend']").text()).toBe(
      "Values marked with a dotted line come from the main record.",
    )
    expect(wrapper.findAll("a[href='/en/node/122']")).toHaveLength(1)
    expect(wrapper.findAll("[aria-describedby='version-inheritance-legend']")).toHaveLength(2)
    expect(rowByLabel(wrapper, "KOS Type").classes()).toContain("metadata-row--inherited")
    expect(rowByLabel(wrapper, "Abbreviation").classes()).not.toContain(
      "metadata-row--inherited",
    )
  })

  it("shows version context independently of the abstract", () => {
    expect(mountPage({ definition: {} }).find("[data-testid='version-context']").exists()).toBe(true)
    expect(mountPage({ versionOf: [] }).find("[data-testid='version-context']").exists()).toBe(false)
  })

  it("selects tabs from the hash and updates it on tab changes", async () => {
    window.history.replaceState({}, "", "/en/node/123#identifiers")
    const wrapper = mountPage()
    await nextTick()

    const headers = wrapper.findAll(".jskos-vue-tabs-header-item")
    expect(headers[3].classes()).toContain("jskos-vue-tabs-header-item-active")
    expect(wrapper.find("[data-testid='concept-browser']").exists()).toBe(false)

    await headers[1].trigger("click")
    expect(window.location.hash).toBe("#access")
    expect(rowByLabel(wrapper, "Access").text()).toContain("freely available")
    expect(selectConcept).not.toHaveBeenCalled()

    await headers[2].trigger("click")
    expect(window.location.hash).toBe("#content")
    expect(wrapper.get("[data-testid='concept-browser']").exists()).toBe(true)

    await headers[4].trigger("click")
    expect(window.location.hash).toBe("#versions")

    await headers[0].trigger("click")
    expect(selectConcept).toHaveBeenCalledWith(null)
    expect(wrapper.find("[data-testid='concept-browser']").exists()).toBe(false)
  })

  it("opens the conditional Versions tab from the URL hash", async () => {
    window.history.replaceState({}, "", "/en/node/123#versions")
    const wrapper = mountPage()
    await nextTick()

    const headers = wrapper.findAll(".jskos-vue-tabs-header-item")
    expect(headers).toHaveLength(5)
    expect(headers[4].text()).toBe("Versions")
    expect(headers[4].get("i").classes()).toEqual(["fas", "fa-code-branch"])
    expect(headers[4].get("i").attributes("aria-hidden")).toBe("true")
    expect(headers[4].classes()).toContain("jskos-vue-tabs-header-item-active")
  })

  it("omits the Versions tab when there are no incoming versions", async () => {
    window.history.replaceState({}, "", "/en/node/123#versions")
    const wrapper = mountPage({ _versionOfBacklink: [] })
    await nextTick()

    const headers = wrapper.findAll(".jskos-vue-tabs-header-item")
    expect(headers).toHaveLength(4)
    expect(headers.some(header => header.text() === "Versions")).toBe(false)
    expect(headers[0].classes()).toContain("jskos-vue-tabs-header-item-active")
    expect(wrapper.find(".terminology-versions").exists()).toBe(false)
  })

  it("does not mount the concept browser for an empty API list", async () => {
    window.history.replaceState({}, "", "/en/node/123#content")
    const wrapper = mountPage({ API: [] })
    await nextTick()

    expect(wrapper.find("[data-testid='concept-browser']").exists()).toBe(false)
  })
})
