// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import NotFoundPage from "../../vue/pages/NotFoundPage.vue"

describe("NotFoundPage", () => {
  it("explains the not found message", () => {
    const wrapper = mount(NotFoundPage)

    // expect(wrapper.get("h1").text()).toBe("Not Found")
    expect(wrapper.text()).toContain("Sorry, the resource could not be found!")
    expect(wrapper.text()).toContain("Search by URI:")

    // 1. Verify the form exists
    const form = wrapper.find("form")
    expect(form.exists()).toBe(true)

    // 2. Verify form attributes match your markup
    expect(form.attributes("action")).toBe("/")
    expect(form.attributes("method")).toBe("get")

    // 3. Verify the form contains the necessary inputs
    const textInput = form.find("input[type=\"text\"]")
    const submitInput = form.find("input[type=\"submit\"]")

    expect(textInput.exists()).toBe(true)
    expect(textInput.attributes("name")).toBe("uri")
    expect(submitInput.exists()).toBe(true)
  })
})
