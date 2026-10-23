// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { ref } from "vue"
import { describe, expect, it, vi } from "vitest"
import TheHeader from "../../vue/components/TheHeader.vue"

describe("shared header integration", () => {
  it("keeps login, add and active navigation available in the shared menu", async () => {
    const userCanAdd = ref(true)
    const wrapper = mount(TheHeader, {
      attachTo: document.body,
      global: {
        provide: {
          header: {
            activePath: "/stats",
            userCanAdd,
          },
          login: {
            connected: false,
            loggedIn: false,
            user: null,
            providers: [],
            client: null,
            lastError: null,
            errors: {
              NoInternetConnectionError: class extends Error {},
              ThirdPartyCookiesBlockedError: class extends Error {},
              ServerConnectionError: class extends Error {},
            },
            openLoginWindow: vi.fn(),
            openBaseWindow: vi.fn(),
            openLogoutWindow: vi.fn(),
          },
        },
      },
    })

    expect(wrapper.find(".bartoc-header__user-status > .user-status > a").exists()).toBe(true)
    expect(wrapper.find(".bartoc-header__user-status .user-status-dropdown").exists()).toBe(true)
    expect(wrapper.get(".bartoc-header__logo-link").attributes("href")).toBe("/")
    expect(wrapper.get("a[href='/stats']").attributes("aria-current")).toBe("page")
    expect(wrapper.get("a[href='/contact']").text()).toBe("Contact & Editors")
    expect(wrapper.get("a[href='/edit']").text()).toBe("Add")

    const menuButton = wrapper.get(".bartoc-header__menu-button")
    expect(menuButton.attributes("aria-expanded")).toBe("false")
    await menuButton.trigger("click")
    expect(menuButton.attributes("aria-expanded")).toBe("true")

    await wrapper.get(".bartoc-header").trigger("keydown", { key: "Escape" })
    expect(menuButton.attributes("aria-expanded")).toBe("false")
    expect(document.activeElement).toBe(menuButton.element)

    userCanAdd.value = false
    await wrapper.vm.$nextTick()
    expect(wrapper.find("a[href='/edit']").exists()).toBe(false)
    wrapper.unmount()
  })

  it("highlights paths with trailing slashes and keeps the home path valid", async () => {
    const wrapper = mount(TheHeader, {
      props: { activePath: "/stats/" },
      global: { stubs: { UserStatus: true } },
    })

    expect(wrapper.get("a[href='/stats']").attributes("aria-current")).toBe("page")
    await wrapper.setProps({ activePath: "/" })
    expect(wrapper.findAll("a[aria-current='page']")).toHaveLength(0)
    wrapper.unmount()
  })
})
