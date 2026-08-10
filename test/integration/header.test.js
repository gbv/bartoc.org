// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { ref } from "vue"
import { describe, expect, it, vi } from "vitest"
import TheHeader from "../../vue/components/TheHeader.vue"

describe("shared header integration", () => {
  it("renders UserStatus trigger and dropdown inside the shared slot wrapper", () => {
    const wrapper = mount(TheHeader, {
      global: {
        provide: {
          header: {
            activePath: "/stats",
            userCanAdd: ref(true),
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
    expect(wrapper.get("a[href='/edit']").text()).toBe("add")
  })
})
