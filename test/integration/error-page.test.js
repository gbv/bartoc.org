// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import ErrorPage from "../../vue/pages/ErrorPage.vue"

describe("ErrorPage", () => {
  it("renders the error title and message", () => {
    const wrapper = mount(ErrorPage, {
      props: {
        title: "Backend unavailable",
        message: "Error: Backend unavailable",
      },
    })

    expect(wrapper.get("h1").text()).toBe("Backend unavailable")
    expect(wrapper.text()).toContain("Please contact the administrator")
    expect(wrapper.get(".jumbotron").text()).toBe("Error: Backend unavailable")
  })
})
