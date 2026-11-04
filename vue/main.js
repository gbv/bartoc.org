import { computed, ref, toRefs, watch } from "vue"

import { createBartocApp } from "./appFactory.js"
import { loadClientPage } from "./pages/client.js"
import { parseJson } from "./utils/parseJson.js"
import { Login } from "gbv-login-client-vue"

// Read the data used for server rendering so Vue can hydrate the same page.
const serverState = parseJson(document.getElementById("page-state")?.textContent)

import { render } from "../node_modules/timeago.js/"
import "jskos-vue/dist/style.css"

const { token } = toRefs(Login)
const userCanAdd = ref(false)
const permissionChecked = ref(false)

// The user status is actionable only after the login client connects.
const loginReady = computed(() => Login.connected)
// Keep Add's place until its permission check has finished.
const addReady = computed(() => loginReady.value &&
  (!Login.loggedIn || (Boolean(token.value) && permissionChecked.value)))

watch(token, async currentToken => {
  // Clear the previous login's permission while checking the new token.
  userCanAdd.value = false
  permissionChecked.value = false
  if (!currentToken) {
    permissionChecked.value = true
    return
  }

  const url = "/api/checkAuth?type=schemes&action=create"
  const headers = { Authorization: `Bearer ${currentToken}` }
  try {
    const response = await fetch(url, { headers })
    // Ignore a response if the user has logged out or changed tokens.
    if (token.value === currentToken) {
      userCanAdd.value = response.ok
    }
  } catch {
    // The permission stays false if the request fails.
  } finally {
    if (token.value === currentToken) {
      permissionChecked.value = true
    }
  }
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
      loginReady,
      addReady,
    },
  })

  // Keep the SSR login state anonymous until Vue has hydrated the header.
  app.mount("#app")
  Login.connect(serverState.login.api, { ssl: serverState.login.ssl })

  // Plain JavaScript is sufficient for relative timestamps.
  // See https://github.com/hustcc/timeago.js/issues/230
  const timeagoNodes = document.querySelectorAll(".timeago")
  if (timeagoNodes.length) {
    render(timeagoNodes)
  }
}

hydrate().catch(error => console.error("Could not hydrate the page.", error))
