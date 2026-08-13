// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import ConceptPage from "../../vue/pages/ConceptPage.vue"

function rowsByLabel(wrapper) {
  return Object.fromEntries(
    wrapper.findAll("tr").map(row => {
      const cells = row.findAll("td")
      return [cells[0].text().trim(), cells[1]]
    }),
  )
}

describe("ConceptPage", () => {
  it("renders concept metadata and links", () => {
    const wrapper = mount(ConceptPage, {
      props: {
        title: "German",
        item: {
          uri: "https://example.org/language/de",
          prefLabel: { en: "German" },
          inScheme: [{
            uri: "http://bartoc.org/en/node/20287",
            prefLabel: { en: "Languages" },
          }],
          notation: ["de", "ger"],
          identifier: ["identifier:de", "<unsafe>"],
          url: "https://example.org/german",
          startDate: "2001",
          endDate: "2020",
          publisher: [{
            uri: "https://example.org/publishers/1",
            prefLabel: { en: "Example publisher" },
          }],
          license: [{
            uri: "https://example.org/licenses/open",
            prefLabel: { en: "Open license" },
          }],
          created: "2024-01-01",
          issued: "2024-02-01",
          modified: "2024-02-01",
        },
      },
    })

    expect(wrapper.get("h1").text()).toBe("German")

    const rows = rowsByLabel(wrapper)
    expect(rows.Vocabulary.get("a").attributes("href")).toBe("/en/node/20287")
    expect(rows.URI.text()).toBe("https://example.org/language/de")
    expect(rows.URI.get("a").attributes()).toMatchObject({
      href: "https://example.org/language/de",
      target: "_blank",
      rel: "noopener noreferrer",
    })
    expect(rows.Notation.text()).toContain("de")
    expect(rows.Notation.text()).toContain("ger")
    expect(rows.Identifiers.text()).toContain("<unsafe>")
    expect(rows.Identifiers.html()).not.toContain("<unsafe>")
    expect(rows.Homepage.get("a").attributes("href")).toBe("https://example.org/german")
    expect(rows.Created.text()).toBe("2001")
    expect(rows.Dissolved.text()).toBe("2020")
    expect(rows.Publisher.get("a").attributes("href")).toBe(
      "/publisher?uri=https%3A%2F%2Fexample.org%2Fpublishers%2F1",
    )
    expect(rows.License.get("a").attributes("href")).toBe(
      "/vocabularies?license=https%3A%2F%2Fexample.org%2Flicenses%2Fopen",
    )

    expect(wrapper.get("a[href='/vocabularies?languages=de,ger']").text()).toContain(
      "vocabularies in this language",
    )
    expect(wrapper.findAll("time").map(time => time.text())).toEqual([
      "2024-01-01",
      "2024-02-01",
    ])
    expect(wrapper.text()).not.toContain("modified 2024-02-01")
  })

  it("omits empty metadata and the language search for other schemes", () => {
    const wrapper = mount(ConceptPage, {
      props: {
        title: "Minimal concept",
        item: {
          uri: "http://bartoc.org/concept/minimal",
          prefLabel: { en: "Minimal concept" },
          inScheme: [{
            uri: "http://bartoc.org/en/node/123",
            prefLabel: { en: "Other vocabulary" },
          }],
        },
      },
    })

    const rows = rowsByLabel(wrapper)
    expect(Object.keys(rows)).toEqual(["Vocabulary", "URI"])
    expect(wrapper.text()).not.toContain("vocabularies in this language")
    expect(wrapper.find(".item-dates").exists()).toBe(false)
  })
})
