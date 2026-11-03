import { ref, toRefs, watch } from "vue"

import { createBartocApp } from "./appFactory.js"
import { pages } from "./pages/index.js"
import { parseJson } from "./utils.js"
import { Login } from "gbv-login-client-vue"

// Note: Using the JSON files directly because Lodash is used in config/index.js
import configDefault from "../config/config.default.json"
import configUser from "../config/config.json"
const login = Object.assign({}, configDefault.login, configUser.login || {})

// Read the data used for server rendering so Vue can hydrate the same page.
const serverState = parseJson(document.getElementById("page-state")?.textContent)

import { render } from "../node_modules/timeago.js/"
import "jskos-vue/dist/style.css"

const { token } = toRefs(Login)
const userCanAdd = ref(false)

watch(token, async currentToken => {
  // Clear the previous login's permission while checking the new token.
  userCanAdd.value = false
  if (!currentToken) {
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
    if (token.value === currentToken) {
      userCanAdd.value = false
    }
  }
}, { immediate: true })

// Recreate the server app with its page, props, and shared shell data.
const app = createBartocApp({
  pageComponent: pages[serverState.page],
  pageProps: serverState.pageProps || {},
  footer: serverState.footer || {},
  header: {
    activePath: serverState.header?.activePath || "",
    userCanAdd,
  },
})

// Keep the SSR login state anonymous until Vue has hydrated the header.
app.mount("#app")
Login.connect(login.api, { ssl: login.ssl })

// Plain JavaScript is sufficient for relative timestamps.
// See https://github.com/hustcc/timeago.js/issues/230
const timeagoNodes = document.querySelectorAll(".timeago")
if (timeagoNodes.length) {
  render(timeagoNodes)
}
