// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { markRaw } from "vue"
import { describe, expect, it } from "vitest"
import App from "../../vue/App.vue"

const PageComponent = markRaw({
  props: {
    message: {
      type: String,
      default: "Server-rendered page",
    },
  },
  template: "<p class=\"page-content\">{{ message }}</p>",
})

describe("App", () => {
  it("renders the header, page, and footer together", () => {
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

    expect(wrapper.get("main.app-container .page-content").text()).toBe("Server-rendered page")
    expect(wrapper.get("header").element.nextElementSibling).toBe(wrapper.get("main").element)
    expect(wrapper.get("main").element.nextElementSibling).toBe(wrapper.get("footer").element)

    wrapper.unmount()
  })

  it("passes initial page props to the selected component", () => {
    const wrapper = mount(App, {
      props: {
        pageComponent: PageComponent,
        pageProps: {
          message: "Error from the server",
        },
      },
      global: {
        stubs: {
          TheHeader: true,
          TheFooter: true,
        },
      },
    })

    expect(wrapper.get(".page-content").text()).toBe("Error from the server")
  })
})
