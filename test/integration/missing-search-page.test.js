// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import MissingSearchPage from "../../vue/pages/MissingSearchPage.vue"

describe("MissingSearchPage", () => {
  it("explains how to enable the vocabulary search application", () => {
    const wrapper = mount(MissingSearchPage)

    expect(wrapper.get("h1").text()).toBe("Missing bartoc-search")
    expect(wrapper.text()).toContain("BARTOC.org seems not fully configured yet.")
    expect(wrapper.get("a").attributes("href")).toBe("https://github.com/gbv/bartoc-search/")
  })
})
