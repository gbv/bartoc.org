// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest"
import { mount } from "@vue/test-utils"
import VocabularySearch from "../../vue/components/VocabularySearch.vue"

function mountSearch(props = {}) {
  return mount(VocabularySearch, {
    props,
  })
}

describe("VocabularySearch Component", () => {
  beforeEach(() => {
    // jsdom has a real window.location, but assigning href can be annoying in tests.
    // Here we mock only what the component needs.
    delete window.location
    window.location = { href: "" }
  })

  it("shows the schemes count when available", () => {
    const wrapper = mountSearch({
      schemesCount: 144,
    })

    expect(wrapper.text()).toContain("Search in metadata about")
    expect(wrapper.text()).toContain("144")
    expect(wrapper.text()).toContain("terminologies")
  })

  it("does not show the schemes count when it is null or zero", () => {
    const withNull = mountSearch({
      schemesCount: null,
    })

    expect(withNull.text()).not.toContain("Search in metadata about")

    const withZero = mountSearch({
      schemesCount: 0,
    })

    expect(withZero.text()).not.toContain("Search in metadata about")
  })

  it("initializes search and selected field from query", () => {
    const wrapper = mountSearch({
      query: {
        search: "dfg",
        field: "title_search",
      },
    })

    const input = wrapper.get("input")
    const select = wrapper.get("select")

    expect(input.element.value).toBe("dfg")
    expect(select.element.value).toBe("title_search")
  })

  it("uses an empty all-fields default field", () => {
    const wrapper = mountSearch({
      query: {
        search: "dfg",
      },
    })

    expect(wrapper.get("select").element.value).toBe("")
  })

  it("redirects to vocabularies search on submit with Title field", async () => {
    const wrapper = mountSearch({
      query: {
        search: "dfg",
        field: "title_search",
      },
    })

    await wrapper.get("form").trigger("submit")

    expect(window.location.href).toBe(
      "/vocabularies?search=dfg&field=title_search",
    )
  })

  it("redirects with the current search input and selected field", async () => {
    const wrapper = mountSearch()

    await wrapper.get("input").setValue("skos")
    await wrapper.get("select").setValue("subject_notation")
    await wrapper.get("form").trigger("submit")

    expect(window.location.href).toBe(
      "/vocabularies?search=skos&field=subject_notation",
    )
  })

  it("does not include empty search parameter", async () => {
    const wrapper = mountSearch({
      query: {
        search: "",
        field: "publisher_en",
      },
    })

    await wrapper.get("form").trigger("submit")

    expect(window.location.href).toBe(
      "/vocabularies?field=publisher_en",
    )
  })

  it("offers subject search fields", () => {
    const wrapper = mountSearch()

    const options = wrapper.findAll("option").map(option => ({
      label: option.text(),
      value: option.element.value,
    }))

    expect(options).toEqual(expect.arrayContaining([
      { label: "Subject notation", value: "subject_notation" },
      { label: "Subject URI", value: "subject_uri" },
    ]))
  })

})
