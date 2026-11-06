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
const userCanEdit = ref(false)
const permissionChecked = ref(false)
const editPermissionChecked = ref(false)

// The user status is actionable only after the login client connects.
const loginReady = computed(() => Login.connected)
// Keep Add's place until its permission check has finished.
const addReady = computed(() => loginReady.value &&
  (!Login.loggedIn || (Boolean(token.value) && permissionChecked.value)))

// Keep Edit's place until its permission check has finished.
const editReady = computed(() => loginReady.value &&
  (!Login.loggedIn || (Boolean(token.value) && editPermissionChecked.value)))

async function checkPermission(action, currentToken) {
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

watch(token, currentToken => {
  // Clear the previous login's permission while checking the new token.
  userCanAdd.value = false
  permissionChecked.value = false
  userCanEdit.value = false
  editPermissionChecked.value = false

  if (!currentToken) {
    permissionChecked.value = true
    editPermissionChecked.value = true
    return
  }

  checkPermission("create", currentToken).then(allowed => {
    if (token.value !== currentToken) {
      return
    }

    userCanAdd.value = allowed
    permissionChecked.value = true
  })

  checkPermission("update", currentToken).then(allowed => {
    if (token.value !== currentToken) {
      return
    }

    userCanEdit.value = allowed
    editPermissionChecked.value = true
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
      loginReady,
      addReady,
      editReady,
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
