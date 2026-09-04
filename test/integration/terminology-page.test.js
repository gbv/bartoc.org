// @vitest-environment jsdom
import { defineComponent, h, nextTick, ref } from "vue"
import { flushPromises, mount } from "@vue/test-utils"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import TerminologyPage from "../../vue/pages/TerminologyPage.vue"
import { loadWikipediaLinks } from "../../vue/utils/wikipedia.js"

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

function jsonResponse(data) {
  return { ok: true, json: async () => data }
}

function wikidataResponse(pages) {
  return jsonResponse({ results: { bindings: pages } })
}

function wikipediaPage(url, languageCode) {
  return {
    url: { value: url },
    language: { value: languageCode },
  }
}

describe("TerminologyPage", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/en/node/123")
    window.sessionStorage.clear()
    selectConcept.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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

  it("shows Wikipedia links below the homepage", async () => {
    const wikipediaPages = [
      wikipediaPage("https://de.wikipedia.org/wiki/Test", "de"),
      wikipediaPage("https://en.wikipedia.org/wiki/Test", "en"),
    ]
    const languageConcepts = [
      { notation: ["de", "ger", "deu"], prefLabel: { en: "German " } },
      { notation: ["en", "eng"], prefLabel: { en: "English" } },
    ]
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(wikidataResponse(wikipediaPages))
      .mockResolvedValueOnce(jsonResponse(languageConcepts))
    vi.stubGlobal("fetch", fetchMock)
    const identifier = "http://www.wikidata.org/entity/Q123"
    const wrapper = mountPage({
      identifier: ["TEST", identifier],
      url: "https://example.org",
    })

    await flushPromises()

    const wikidataRequestUrl = fetchMock.mock.calls[0][0]
    expect(wikidataRequestUrl.origin + wikidataRequestUrl.pathname).toBe(
      "https://query.wikidata.org/sparql",
    )
    expect(wikidataRequestUrl.searchParams.get("query")).toContain(`<${identifier}>`)
    const languageRequestUrl = fetchMock.mock.calls[1][0]
    expect(languageRequestUrl.pathname).toBe("/api/concepts")
    expect(languageRequestUrl.searchParams.get("uri")).toBe(
      "https://bartoc.org/language/de|https://bartoc.org/language/en",
    )
    expect(languageRequestUrl.searchParams.get("voc")).toBe(
      "http://bartoc.org/en/node/20287",
    )
    const labels = wrapper.findAll("tr").map(row => row.find("td").text())
    const homepageIndex = labels.indexOf("Homepage")
    expect(labels[homepageIndex + 1]).toBe("Wikipedia")
    expect(rowByLabel(wrapper, "Wikipedia").findAll("a").map(link => ({
      text: link.text(),
      href: link.attributes("href"),
    }))).toEqual([
      { text: "German", href: "https://de.wikipedia.org/wiki/Test" },
      { text: "English", href: "https://en.wikipedia.org/wiki/Test" },
    ])
  })

  it("keeps Wikipedia language codes when their labels cannot be loaded", async () => {
    const url = "https://example.wikipedia.org/wiki/Test"
    const wikipediaPages = [
      wikipediaPage(url, "example"),
    ]
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(wikidataResponse(wikipediaPages))
      .mockResolvedValueOnce({ ok: false })
    vi.stubGlobal("fetch", fetchMock)

    const wikipediaLinks = await loadWikipediaLinks([
      "http://www.wikidata.org/entity/Q123",
    ])

    expect(wikipediaLinks).toEqual([{ url, languageName: "example" }])
  })

  it("reuses cached Wikipedia language labels", async () => {
    const wikipediaPages = [
      wikipediaPage("https://de.wikipedia.org/wiki/Test", "de"),
    ]
    const languageConcepts = [
      { notation: ["de"], prefLabel: { en: "German" } },
    ]
    const pagesResponse = wikidataResponse(wikipediaPages)
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(pagesResponse)
      .mockResolvedValueOnce(jsonResponse(languageConcepts))
      .mockResolvedValueOnce(pagesResponse)
    vi.stubGlobal("fetch", fetchMock)

    await loadWikipediaLinks(["http://www.wikidata.org/entity/Q123"])
    const wikipediaLinks = await loadWikipediaLinks([
      "http://www.wikidata.org/entity/Q456",
    ])

    expect(wikipediaLinks[0].languageName).toBe("German")
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("loads Wikipedia language names in batches of 50", async () => {
    const wikipediaPages = Array.from({ length: 51 }, (_, index) => (
      wikipediaPage(`https://example.org/wiki/${index}`, `code-${index}`)
    ))
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(wikidataResponse(wikipediaPages))
      .mockResolvedValue(jsonResponse([]))
    vi.stubGlobal("fetch", fetchMock)

    await loadWikipediaLinks(["http://www.wikidata.org/entity/Q123"])

    const languageRequests = fetchMock.mock.calls.slice(1)
      .map(([requestUrl]) => requestUrl)
    expect(languageRequests.map(requestUrl => (
      requestUrl.searchParams.get("uri").split("|").length
    ))).toEqual([50, 1])
  })

  it("ignores identifiers that do not match", () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const wrapper = mountPage({
      identifier: ["https://www.wikidata.org/entity/Q123"],
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(rowByLabel(wrapper, "Wikipedia")).toBeUndefined()
  })

  it("shows the version number", () => {
    const wrapper = mountPage({ version: " 3.0 " })
    const row = rowByLabel(wrapper, "Version")

    expect(row.findAll("td")[1].text()).toBe("3.0")
    expect(rowByLabel(mountPage({ version: undefined }), "Version")).toBeUndefined()
  })

  it("shows the version number next to the main record", () => {
    const context = mountPage({ version: "3.0" }).get("[data-testid='version-context']")

    expect(context.text()).toBe("This is version 3.0 of Earlier Version.")
    expect(context.get("a").attributes("href")).toBe("/en/node/122")
  })

  it("marks a title from the main record", () => {
    const wrapper = mountPage(
      { prefLabel: { en: "Test Vocabulary 3.0" } },
      { prefLabel: { from: "http://bartoc.org/en/node/122" } },
    )
    const titlesRow = rowByLabel(wrapper, "Titles")

    expect(titlesRow.attributes("aria-describedby")).toBe("version-inheritance-legend")
    expect(titlesRow.find(".inherited-field-marker").exists()).toBe(true)
  })

  it("shows linked versions", () => {
    const versionOf = [{ uri: item.uri }]
    const wrapper = mountPage({
      versionOf: [],
      _versionOfBacklink: [
        {
          uri: "http://bartoc.org/en/node/125",
          prefLabel: { en: "Minimal version" },
          versionOf,
        },
        {
          uri: "http://bartoc.org/en/node/20827",
          prefLabel: { en: "New Thesaurus for the Social Sciences" },
          version: "4.0",
          versionOf,
          startDate: "2009",
          extent: "Approximately 12,000 concepts (2025-08)",
        },
        {
          uri: "http://bartoc.org/en/node/294",
          version: "3.0",
          versionOf,
          startDate: "2004",
          extent: "8223 classes (2022-09)",
        },
      ],
    })
    const entries = wrapper.findAll(".terminology-versions > li")

    expect(entries.map(entry => entry.text())).toEqual([
      "Test Vocabulary 3.0 since 2004 · 8223 classes (2022-09) · BARTOC ID 294",
      "New Thesaurus for the Social Sciences version 4.0 · since 2009 · Approximately 12,000 concepts (2025-08) · BARTOC ID 20827",
      "Minimal version BARTOC ID 125",
    ])
  })

  it("marks inherited fields and explains them once", () => {
    const source = { from: "http://bartoc.org/en/node/122" }
    const wrapper = mountPage({}, {
      definition: source,
      type: source,
      languages: source,
    })

    const legend = wrapper.get("[data-testid='version-inheritance-legend']")
    expect(legend.text()).toContain("Values derived from the main record")
    expect(legend.find(".version-inheritance-marker[aria-hidden='true']").exists()).toBe(true)
    expect(wrapper.findAll("a[href='/en/node/122']")).toHaveLength(1)
    expect(wrapper.findAll("[aria-describedby='version-inheritance-legend']")).toHaveLength(3)
    expect(wrapper.findAll(".inherited-field-marker[aria-hidden='true']")).toHaveLength(3)
  })

  it("places version context after the title and audit dates below the tabs", () => {
    const wrapper = mountPage({
      created: "2026-08-21T11:46:00Z",
    })

    const context = wrapper.get("[data-testid='version-context']")
    expect(wrapper.get("h1").element.nextElementSibling).toBe(context.element)
    expect(wrapper.get(".item-dates").element.previousElementSibling).toBe(
      wrapper.get(".jskos-vue-tabs").element,
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
    expect(headers[4].find(".fa-code-branch[aria-hidden='true']").exists()).toBe(true)
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
