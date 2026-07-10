// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import App from "../../vue/App.vue"

const PageComponent = {
  template: "<p class=\"page-content\">Server-rendered page</p>",
}

describe("App", () => {
  it("keeps page content local and teleports the header and footer", () => {
    const headerTarget = document.createElement("div")
    const footerTarget = document.createElement("div")
    headerTarget.id = "header-app"
    footerTarget.id = "footer-app"
    document.body.append(headerTarget, footerTarget)

    const wrapper = mount(App, {
      props: {
        pageComponent: PageComponent,
      },
      global: {
        stubs: {
          TheHeader: { template: "<header />" },
          TheFooter: { template: "<footer />" },
        },
      },
    })

    expect(wrapper.get(".page-content").text()).toBe("Server-rendered page")
    expect(headerTarget.querySelector("header")).not.toBeNull()
    expect(footerTarget.querySelector("footer")).not.toBeNull()

    wrapper.unmount()
    headerTarget.remove()
    footerTarget.remove()
  })
})
