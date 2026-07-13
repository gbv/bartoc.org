import { computed, createApp, markRaw, ref, toRefs, watch } from "vue"

import App from "./App.vue"
import VocabularySearch from "./components/VocabularySearch.vue"
import ServiceLink from "./components/ServiceLink.vue"
import ConceptBrowser from "./components/ConceptBrowser.vue"
import RegistryList from "./components/RegistryList.vue"
import RegistryVocabularies from "./components/RegistryVocabularies.vue"
import { pages } from "./pages/index.js"
import { library } from "@fortawesome/fontawesome-svg-core"
import { faLanguage } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { parseJson } from "./utils.js"
import { Login } from "gbv-login-client-vue"

// Add icons to the library, in this case language
library.add(faLanguage)

// Note: Using the JSON files directly because Lodash is used in config/index.js
import configDefault from "../config/config.default.json"
import configUser from "../config/config.json"
const login = Object.assign({}, configDefault.login, configUser.login || {})

// Footer context comes from EJS-rendered data attributes on the app root.
const rootElement = document.getElementById("app")
const pageProps = parseJson(document.getElementById("page-props")?.textContent)
const footer = {
  siteName: rootElement?.dataset.siteName || "BARTOC.org",
  itemUri: rootElement?.dataset.itemUri || "",
  api: rootElement?.dataset.api || "",
  query: parseJson(rootElement?.dataset.query),
}

import { render } from "../node_modules/timeago.js/"
import "jskos-vue/dist/style.css"

const { token, user } = toRefs(Login)
const auth = computed(() => token.value ? { token: token.value } : null)
const userCanAdd = ref(false)

watch(token, async currentToken => {
  if (!currentToken) {
    userCanAdd.value = false
    return
  }

  const url = "/api/checkAuth?type=schemes&action=create"
  const headers = { Authorization: `Bearer ${currentToken}` }
  try {
    const response = await fetch(url, { headers })
    userCanAdd.value = response.ok
  } catch {
    userCanAdd.value = false
  }
}, { immediate: true })

// EJS still renders the route-specific page markup. App.vue owns the shell
// and renders this component where bartoc-search would render RouterView.
const EjsPageContent = markRaw({
  name: "PageContent",
  components: {
    VocabularySearch,
    ServiceLink,
    ConceptBrowser,
    RegistryList,
    RegistryVocabularies,
  },
  setup() {
    return { auth, user, userCanAdd }
  },
  template: rootElement?.innerHTML || "",
})

const pageComponent = markRaw(pages[rootElement?.dataset.page] || EjsPageContent)
const app = createApp(App, { pageComponent, pageProps })
app.provide("footer", footer)
app.provide("header", {
  activePath: rootElement?.dataset.pagePath || "",
  userCanAdd,
})
app.use(Login)
Login.connect(login.api, { ssl: login.ssl })
app.component("FontAwesomeIcon", FontAwesomeIcon)

app.mount("#app")

// Plain JavaScript is sufficient for relative timestamps.
// See https://github.com/hustcc/timeago.js/issues/230
const timeagoNodes = document.querySelectorAll(".timeago")
if (timeagoNodes.length) {
  render(timeagoNodes)
}
