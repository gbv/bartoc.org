// @vitest-environment jsdom
import { flushPromises } from "@vue/test-utils"
import { nextTick } from "vue"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("../../config/config.json", () => ({ default: {} }))

vi.mock("gbv-login-client-vue", async () => {
  const { reactive } = await import("vue")
  return {
    Login: reactive({ token: null, user: null, connect: vi.fn(), install: vi.fn() }),
  }
})

// Show the permission passed by main.js without loading a full page.
vi.mock("../../vue/App.vue", async () => {
  const { h, inject } = await import("vue")
  return {
    default: {
      setup() {
        const header = inject("header")
        return () => header.userCanAdd.value ? h("a", { href: "/edit" }, "Add") : null
      },
    },
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ""
})

describe("header authorization", () => {
  it("keeps Add tied to the current token when requests finish out of order", async () => {
    // Keep requests pending so we can choose when each response arrives.
    const loggedOutRequest = Promise.withResolvers()
    const oldRequest = Promise.withResolvers()
    const currentRequest = Promise.withResolvers()
    vi.stubGlobal("fetch", vi.fn()
      .mockReturnValueOnce(loggedOutRequest.promise)
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(currentRequest.promise)
      .mockResolvedValueOnce({ ok: false }))
    document.body.innerHTML = "<main id='app'></main>"
    await import("../../vue/main.js")
    const { Login } = await import("gbv-login-client-vue")
    const addLink = () => document.querySelector("a[href='/edit']")

    expect(addLink()).toBeNull()
    Login.token = "logged-out-token"
    await nextTick()
    Login.token = null
    await nextTick()
    loggedOutRequest.resolve({ ok: true })
    await flushPromises()
    expect(addLink()).toBeNull()

    Login.token = "old-token"
    await nextTick()
    Login.token = "current-token"
    await nextTick()
    currentRequest.resolve({ ok: true })
    await flushPromises()
    expect(addLink()).not.toBeNull()
    oldRequest.reject(new Error("Old request failed"))
    await flushPromises()
    expect(addLink()).not.toBeNull()

    Login.token = "denied-token"
    await nextTick()
    expect(addLink()).toBeNull()
    await flushPromises()
    expect(addLink()).toBeNull()
  })
})
