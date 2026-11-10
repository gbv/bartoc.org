import { readonly, ref, toRaw, watch } from "vue"

// Resolve edit access only after the login server has authenticated the
// connection and then reported the restored account.
export function createEditAccess(Login, requestUpdatePermission) {
  const editAccess = ref("pending")
  let account = "connecting"
  let permissionRequest = 0

  function setPending() {
    permissionRequest += 1
    editAccess.value = "pending"
  }

  async function resolveEditAccess(currentToken) {
    if (account !== "logged-in" || !currentToken) {
      setPending()
      return
    }

    const request = ++permissionRequest
    editAccess.value = "pending"
    const allowed = await requestUpdatePermission(currentToken)

    // Ignore results from an account or token that changed during the request.
    if (
      request !== permissionRequest
      || account !== "logged-in"
      || Login.token !== currentToken
    ) {
      return
    }

    editAccess.value = allowed ? "allowed" : "denied"
  }

  function start() {
    // login-client-vue exposes its client through readonly(). Event listener
    // registration must use the original instance so it can update its list.
    const client = toRaw(Login.client)

    // connect is emitted for the server's authenticated message. The next
    // login or logout event is therefore the restored account result.
    client.addEventListener(Login.events.connect, () => {
      account = "restoring"
      setPending()
    })

    client.addEventListener(Login.events.login, () => {
      if (account === "connecting") {
        return
      }

      account = "logged-in"
      resolveEditAccess(Login.token)
    })

    client.addEventListener(Login.events.logout, () => {
      // login-server may send a preliminary loggedOut before authenticated.
      if (account === "connecting") {
        return
      }

      account = "anonymous"
      permissionRequest += 1
      editAccess.value = "denied"
    })

    client.addEventListener(Login.events.disconnect, () => {
      account = "connecting"
      setPending()
    })
  }

  // A logged-in account can receive its token after the account event, and
  // token refreshes require the update permission to be checked again.
  watch(() => Login.token, currentToken => {
    if (account === "logged-in") {
      resolveEditAccess(currentToken)
    }
  })

  return {
    editAccess: readonly(editAccess),
    start,
  }
}
