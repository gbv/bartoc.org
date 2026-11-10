import { nextTick, readonly, shallowReactive } from "vue"
import { describe, expect, it, vi } from "vitest"
import { createEditAccess } from "../../vue/editAccess.js"

function createLoginHarness() {
  const listeners = new Map()
  const events = {
    connect: "connect",
    disconnect: "disconnect",
    login: "login",
    logout: "logout",
  }
  const client = {
    addEventListener(type, callback) {
      const callbacks = listeners.get(type) || []
      callbacks.push(callback)
      listeners.set(type, callbacks)
    },
  }
  // Match login-client-vue, which exposes the client as a readonly value.
  const Login = shallowReactive({ token: null, client: readonly(client), events })

  return {
    Login,
    emit(type) {
      for (const callback of listeners.get(type) || []) {
        callback({ type })
      }
    },
  }
}

async function settlePermissionCheck() {
  await nextTick()
  await Promise.resolve()
}

describe("edit access", () => {
  it("ignores a preliminary logout and allows the restored editor", async () => {
    const { Login, emit } = createLoginHarness()
    const checkPermission = vi.fn().mockResolvedValue(true)
    const { editAccess, start } = createEditAccess(Login, checkPermission)
    start()

    emit(Login.events.logout)
    expect(editAccess.value).toBe("pending")

    emit(Login.events.connect)
    emit(Login.events.login)
    Login.token = "editor-token"
    await settlePermissionCheck()

    expect(checkPermission).toHaveBeenCalledWith("editor-token")
    expect(editAccess.value).toBe("allowed")
  })

  it("denies access after the authenticated session confirms anonymity", () => {
    const { Login, emit } = createLoginHarness()
    const checkPermission = vi.fn()
    const { editAccess, start } = createEditAccess(Login, checkPermission)
    start()

    emit(Login.events.logout)
    emit(Login.events.connect)
    emit(Login.events.logout)

    expect(checkPermission).not.toHaveBeenCalled()
    expect(editAccess.value).toBe("denied")
  })

  it("denies a restored user without update permission", async () => {
    const { Login, emit } = createLoginHarness()
    const checkPermission = vi.fn().mockResolvedValue(false)
    const { editAccess, start } = createEditAccess(Login, checkPermission)
    start()

    emit(Login.events.connect)
    emit(Login.events.login)
    Login.token = "read-only-token"
    await settlePermissionCheck()

    expect(editAccess.value).toBe("denied")
  })

  it("returns to pending during a temporary disconnection", async () => {
    const { Login, emit } = createLoginHarness()
    const { editAccess, start } = createEditAccess(Login, vi.fn().mockResolvedValue(true))
    start()

    emit(Login.events.connect)
    emit(Login.events.login)
    Login.token = "editor-token"
    await settlePermissionCheck()
    expect(editAccess.value).toBe("allowed")

    emit(Login.events.disconnect)
    expect(editAccess.value).toBe("pending")
  })
})
