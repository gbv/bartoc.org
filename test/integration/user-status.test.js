// @vitest-environment jsdom
import { beforeEach, describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import UserStatus from "../../vue/components/UserStatus.vue"

const loginMocks = vi.hoisted(() => {
  class ThirdPartyCookiesBlockedError extends Error {}

  const events = {
    connect: "connect",
    disconnect: "disconnect",
    login: "login",
    logout: "logout",
    update: "update",
    error: "error",
    token: "token",
    about: "about",
  }

  const instances = []

  class LoginClient {
    constructor(api, options) {
      this.api = api
      this.options = options
      this.listeners = {}
      this.addEventListener = vi.fn((event, handler) => {
        this.listeners[event] = handler
      })
      this.connect = vi.fn()
      instances.push(this)
    }

    dispatch(event, payload = {}) {
      this.listeners[event](payload)
    }
  }

  LoginClient.events = events
  LoginClient.errors = {
    ThirdPartyCookiesBlockedError,
  }

  return {
    events,
    instances,
    LoginClient,
    ThirdPartyCookiesBlockedError,
  }
})

vi.mock("gbv-login-client", () => ({
  LoginClient: loginMocks.LoginClient,
}))

function mountUserStatus(login = {}) {
  return mount(UserStatus, {
    props: {
      login: {
        api: "login.example.org",
        ssl: true,
        ...login,
      },
    },
  })
}

function client() {
  return loginMocks.instances.at(-1)
}

describe("UserStatus", () => {
  beforeEach(() => {
    loginMocks.instances.length = 0
    window.history.pushState({}, "", "/current?page=1")
  })

  it("connects the login client and renders the login URL", async () => {
    const wrapper = mountUserStatus()

    expect(client().api).toBe("login.example.org")
    expect(client().options).toEqual({ ssl: true })
    expect(client().connect).toHaveBeenCalledTimes(1)

    client().dispatch(loginMocks.events.connect)
    await nextTick()

    const link = wrapper.get("a")

    expect(link.text()).toBe("login")
    expect(link.attributes("href")).toBe(
      "https://login.example.org/login?redirect_uri=" + encodeURIComponent(window.location.href),
    )
  })

  it("updates the rendered user from login, update, and logout events", async () => {
    const wrapper = mountUserStatus()
    const firstUser = { name: "Ada" }
    const updatedUser = { name: "Grace" }

    client().dispatch(loginMocks.events.connect)
    client().dispatch(loginMocks.events.login, { user: firstUser })
    await nextTick()

    expect(wrapper.get("a").text()).toBe("Ada")
    expect(wrapper.get("a").attributes("href")).toBe("https://login.example.org/account")
    expect(wrapper.emitted("update:user").at(-1)).toEqual([firstUser])

    client().dispatch(loginMocks.events.update, { user: updatedUser })
    await nextTick()

    expect(wrapper.get("a").text()).toBe("Grace")
    expect(wrapper.emitted("update:user").at(-1)).toEqual([updatedUser])

    client().dispatch(loginMocks.events.logout)
    await nextTick()

    expect(wrapper.get("a").text()).toBe("login")
    expect(wrapper.emitted("update:user").at(-1)).toEqual([null])
  })

  it("emits auth data when public key and token events arrive", () => {
    const wrapper = mountUserStatus()

    client().dispatch(loginMocks.events.about, { publicKey: "public-key" })
    expect(wrapper.emitted("update:auth").at(-1)).toEqual([null])

    client().dispatch(loginMocks.events.token, { token: "token-value" })
    expect(wrapper.emitted("update:auth").at(-1)).toEqual([
      {
        publicKey: "public-key",
        token: "token-value",
      },
    ])
  })

  it("shows a specific error when third-party cookies are blocked", async () => {
    const wrapper = mountUserStatus()

    client().dispatch(loginMocks.events.error, {
      error: new loginMocks.ThirdPartyCookiesBlockedError(),
    })
    await nextTick()

    expect(wrapper.get("a").attributes("title")).toBe(
      "Login is not possible because third-party cookies are blocked.",
    )
  })
})
