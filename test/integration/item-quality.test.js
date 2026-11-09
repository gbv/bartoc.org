// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils"
import { afterEach, describe, expect, it, vi } from "vitest"
import ItemQuality from "../../vue/components/ItemQuality.vue"

const conceptScheme = "http://www.w3.org/2004/02/skos/core#ConceptScheme"

function validItem(overrides = {}) {
  return {
    uri: "http://bartoc.org/en/node/123",
    prefLabel: { en: "Test vocabulary" },
    definition: { en: ["English abstract"] },
    type: [conceptScheme, "http://w3id.org/nkos/nkostype#thesaurus"],
    extent: "100 concepts",
    license: [{ uri: "https://example.org/license" }],
    url: "https://example.org/vocabulary",
    publisher: [{
      uri: "https://example.org/publisher",
      prefLabel: { en: "Example publisher" },
    }],
    subject: [{ uri: "http://bartoc.org/en/node/1" }],
    FORMAT: [{ uri: "http://bartoc.org/en/Format/json" }],
    languages: ["en"],
    notationExamples: ["EXAMPLE"],
    ...overrides,
  }
}

function findingByTitle(wrapper, title) {
  return wrapper.findAll(".item-quality__finding")
    .find(finding => finding.get(".item-quality__title").text() === title)
}

async function mountQuality(itemOverrides = {}, reportedErrors = []) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => reportedErrors,
  }))
  const wrapper = mount(ItemQuality, {
    props: { item: validItem(itemOverrides) },
  })
  await flushPromises()
  return wrapper
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("ItemQuality", () => {
  it("orders current errors, current warnings, and historical findings", async () => {
    const wrapper = await mountQuality({
      license: undefined,
      publisher: [{ uri: "invalid", prefLabel: { en: "Example publisher" } }],
    }, [
      { type: ["no-license"] },
      { type: ["no-format"] },
    ])

    expect(wrapper.findAll(".item-quality__title").map(title => title.text())).toEqual([
      "Validation errors",
      "Missing license",
      "Missing format",
    ])

    const warning = findingByTitle(wrapper, "Missing license")
    expect(warning.get(".item-quality__indicator").text()).toBe("Warning")
    expect(warning.find(".item-quality__description").exists()).toBe(false)

    const validation = findingByTitle(wrapper, "Validation errors")
    expect(validation.get(".item-quality__indicator").text()).toBe("Error")
    expect(validation.get(".item-quality__message span").text()).toBe(
      "Publisher URI must be a valid HTTP(S) URL!",
    )
    expect(validation.find(".item-quality__messages").exists()).toBe(false)
    expect(validation.get(".item-quality__edit-link").attributes("href")).toBe(
      "/edit?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123#field-publisher",
    )

    const historical = findingByTitle(wrapper, "Missing format")
    expect(historical.classes()).toContain("item-quality__finding--fixed")
    expect(historical.get(".item-quality__indicator").text()).toBe("No longer detected")
    expect(historical.find(".item-quality__edit-link").exists()).toBe(false)
    expect(wrapper.text()).not.toContain("Current issue")
    expect(wrapper.text()).not.toContain("no-license")
    expect(wrapper.text()).not.toContain("no-format")

    expect(wrapper.emitted("count")).toEqual([
      [{ current: 2, total: 2 }],
      [{ current: 2, total: 3 }],
    ])
  })

  it("renders multiple validation messages as one counted finding", async () => {
    const uri = "http://bartoc.org/en/node/123"
    const wrapper = await mountQuality({
      prefLabel: {},
      basedOn: [{ uri }],
      API: [{ url: "invalid" }],
    })

    const findings = wrapper.findAll(".item-quality__finding")
    expect(findings).toHaveLength(1)
    expect(findings[0].get(".item-quality__title").text()).toBe("Validation errors (3)")
    expect(findings[0].get(".item-quality__indicator").text()).toBe("Error")
    expect(findings[0].findAll(".item-quality__messages li > span")
      .map(message => message.text()))
      .toEqual([
        "item must have at least a title!",
        "A terminology cannot be based on itself.",
        "Enter a complete URL starting with http:// or https://.",
      ])
    expect(findings[0].findAll(".item-quality__edit-link").map(link => link.attributes("href")))
      .toEqual([
        "/edit?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123#field-pref-label",
        "/edit?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123#field-based-on",
        "/edit?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123#field-api",
      ])
    expect(findings[0].find(".item-quality__message").exists()).toBe(false)
    expect(wrapper.emitted("count").at(-1)).toEqual([{ current: 1, total: 1 }])
  })

  it("keeps repeated validation messages visible and linked", async () => {
    const wrapper = await mountQuality({
      API: [{ url: "invalid" }, { url: "also-invalid" }],
    })
    const validation = findingByTitle(wrapper, "Validation errors (2)")

    expect(validation.findAll(".item-quality__messages li > span").map(message => message.text()))
      .toEqual([
        "Enter a complete URL starting with http:// or https://.",
        "Enter a complete URL starting with http:// or https://.",
      ])
    expect(validation.findAll(".item-quality__edit-link").map(link => link.attributes("href")))
      .toEqual([
        "/edit?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123#field-api",
        "/edit?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123#field-api",
      ])
  })

  it("links the English title or abstract error to Abstracts", async () => {
    const wrapper = await mountQuality({
      prefLabel: { de: "Deutscher Titel" },
      definition: {},
    })
    const validation = findingByTitle(wrapper, "Validation errors")

    expect(validation.get(".item-quality__message span").text()).toBe(
      "Please provide at least an English title or abstract.",
    )
    expect(validation.get(".item-quality__edit-link").attributes("href"))
      .toBe("/edit?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123#field-definition")
  })

  it("does not link a fixed validation finding", async () => {
    const wrapper = await mountQuality({}, [{ type: ["validation-errors"] }])
    const validation = findingByTitle(wrapper, "Validation errors")

    expect(validation.get(".item-quality__indicator").text()).toBe("No longer detected")
    expect(validation.find(".item-quality__edit-link").exists()).toBe(false)
  })

  it("shows warning-only findings with useful descriptions only", async () => {
    const wrapper = await mountQuality({
      definition: undefined,
      extent: undefined,
      license: undefined,
      publisher: undefined,
    })

    expect(wrapper.findAll(".item-quality__title").map(title => title.text())).toEqual([
      "Missing extent",
      "Missing license",
      "Missing abstract",
      "Missing publisher",
    ])
    expect(wrapper.findAll(".item-quality__indicator").map(indicator => indicator.text()))
      .toEqual(["Warning", "Warning", "Warning", "Warning"])
    expect(findingByTitle(wrapper, "Missing extent").find(".item-quality__description").exists())
      .toBe(false)
    expect(findingByTitle(wrapper, "Missing abstract").get(".item-quality__description").text())
      .toBe("Main records without an abstract")
    const editUrl = "/edit?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123#field-"
    expect(wrapper.findAll(".item-quality__edit-link").map(link => link.attributes("href")))
      .toEqual([
        `${editUrl}extent`,
        `${editUrl}license`,
        `${editUrl}definition`,
        `${editUrl}publisher`,
      ])
    expect(wrapper.emitted("count").at(-1)).toEqual([{ current: 4, total: 4 }])
  })

  it("gives live findings a current status while the report is loading", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})))
    const wrapper = mount(ItemQuality, {
      props: { item: validItem({ license: undefined }) },
    })
    await flushPromises()

    expect(wrapper.get("[role='status']").text()).toBe("Loading daily quality report…")
    expect(findingByTitle(wrapper, "Missing license").get(".item-quality__indicator").text())
      .toBe("Warning")
    expect(wrapper.emitted("count")).toEqual([[{ current: 1, total: 1 }]])
  })

  it("keeps live findings and current counts when the report fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("unavailable")))
    const wrapper = mount(ItemQuality, {
      props: { item: validItem({ license: undefined }) },
    })
    await flushPromises()

    expect(wrapper.get("[role='status']").text()).toBe(
      "Daily report unavailable. Showing current checks only.",
    )
    expect(findingByTitle(wrapper, "Missing license").get(".item-quality__indicator").text())
      .toBe("Warning")
    expect(wrapper.emitted("count")).toEqual([[{ current: 1, total: 1 }]])
  })
})
