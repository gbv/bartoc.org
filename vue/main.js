import { createApp } from "vue"

import ItemEditor from "./components/ItemEditor.vue"
import VocabularySearch from "./components/VocabularySearch.vue"
import ServiceLink from "./components/ServiceLink.vue"
import ConceptBrowser from "./components/ConceptBrowser.vue"
import RegistryList from "./components/RegistryList.vue"
import RegistryVocabularies from "./components/RegistryVocabularies.vue"
import TheFooter from "./components/TheFooter.vue"
import { library } from "@fortawesome/fontawesome-svg-core"
import { faLanguage } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { parseJson } from "./utils.js"

// Add icons to the library, in this case language
library.add(faLanguage)

import UserStatus from "./components/UserStatus.vue"
// Note: Using the JSON files directly because Lodash is used in config/index.js
import configDefault from "../config/config.default.json"
import configUser from "../config/config.json"
const login = Object.assign({}, configDefault.login, configUser.login || {})

// Footer context comes from EJS-rendered data attributes on the app root.
const rootElement = document.getElementById("app")
const footer = {
  siteName: rootElement?.dataset.siteName || "BARTOC.org",
  itemUri: rootElement?.dataset.itemUri || "",
  api: rootElement?.dataset.api || "",
  query: parseJson(rootElement?.dataset.query),
}

import { render } from "../node_modules/timeago.js/"
import "jskos-vue/dist/style.css"
import "@gbv/bartoc-components/style.css"

const app = createApp({
  components: {
    UserStatus,
    ItemEditor,
    VocabularySearch,
    ServiceLink,
    ConceptBrowser,
    RegistryList,
    RegistryVocabularies,
    TheFooter,
  },
  provide() {
    // Make footer data available without repeating props in every EJS view.
    return { footer }
  },
  data() {
    return {
      login,
      user: null,
      userCanAdd: false,
      auth: null,
    }
  },
  mounted() {
    // no need to use a Vue component, plain old JavaScript
    // See https://github.com/hustcc/timeago.js/issues/230
    const nodes = document.querySelectorAll(".timeago")
    if (nodes.length) {
      render(nodes)
    }
  },
  methods: {
    updateUser(user) {
      this.user = user
      this.checkAuth()
    },
    updateAuth(auth) {
      this.auth = auth
      return this.checkAuth()
    },
    checkAuth() {
      if (this.auth) {
        const url = "/api/checkAuth?type=schemes&action=create"
        const headers = { Authorization: `Bearer ${this.auth.token}` }
        fetch(url, { headers }).then(res => {
          this.userCanAdd = res.ok
        })
      } else {
        this.userCanAdd = false
      }
    },
  },
})

app.component("FontAwesomeIcon", FontAwesomeIcon)

app.mount("#app")
