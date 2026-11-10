import { computed, ref, toRefs, watch } from "vue"

import { createBartocApp } from "./appFactory.js"
import { createEditAccess } from "./editAccess.js"
import { loadClientPage } from "./pages/client.js"
import { parseJson } from "./utils/parseJson.js"
import { Login } from "gbv-login-client-vue"

// Read the data used for server rendering so Vue can hydrate the same page.
const serverState = parseJson(document.getElementById("page-state")?.textContent)

import { render } from "../node_modules/timeago.js/"
import "jskos-vue/dist/style.css"

const { token } = toRefs(Login)

// BARTOC permissions are checked separately from the login state. The Add
// action keeps its result and completion flag because the header reserves the
// button's space while the request is pending.
const userCanAdd = ref(false)
const permissionChecked = ref(false)

// Components may replace their account placeholders after the login client
// has established its connection.
const loginReady = computed(() => Login.connected)

// Once the account state is known, anonymous users are ready immediately.
// Authenticated users wait for the permission check for their current token.
const addReady = computed(() => loginReady.value &&
  (!Login.loggedIn || (Boolean(token.value) && permissionChecked.value)))

// Ask the local JSKOS API whether the current token permits one action.
async function requestPermission(action, currentToken) {
  try {
    const response = await fetch(
      `/api/checkAuth?type=schemes&action=${action}`,
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      },
    )
    return response.ok
  } catch {
    return false
  }
}

// Edit access remains pending until the restored account is known. This is
// separate from Add because the header keeps its existing loading behavior.
const {
  editAccess,
  start: startEditAccess,
} = createEditAccess(Login, currentToken => requestPermission("update", currentToken))
const userCanEdit = computed(() => editAccess.value === "allowed")

watch(token, currentToken => {
  // Clear the previous Add permission before checking the new token.
  userCanAdd.value = false
  permissionChecked.value = false
  // Without a token there are no permissions to request.
  if (!currentToken) {
    permissionChecked.value = true
    return
  }

  requestPermission("create", currentToken).then(allowed => {
    // Ignore a response belonging to a token that was replaced meanwhile.
    if (token.value !== currentToken) {
      return
    }

    userCanAdd.value = allowed
    permissionChecked.value = true
  })

}, { immediate: true })

async function hydrate() {
  // Load only this page in the browser, using the same component as SSR.
  const pageComponent = await loadClientPage(serverState.page)
  const app = createBartocApp({
    pageComponent,
    pageProps: serverState.pageProps || {},
    footer: serverState.footer || {},
    header: {
      activePath: serverState.header?.activePath || "",
      userCanAdd,
      userCanEdit,
      editAccess,
      loginReady,
      addReady,
    },
  })

  // Keep the SSR login state anonymous until Vue has hydrated the header.
  app.mount("#app")

  // connect() restores the account asynchronously. The reactive Login values
  // above update the header and permission-dependent content as events arrive.
  Login.connect(serverState.login.api, { ssl: serverState.login.ssl })
  startEditAccess()

  // Plain JavaScript is sufficient for relative timestamps.
  // See https://github.com/hustcc/timeago.js/issues/230
  const timeagoNodes = document.querySelectorAll(".timeago")
  if (timeagoNodes.length) {
    render(timeagoNodes)
  }
}

hydrate().catch(error => console.error("Could not hydrate the page.", error))
