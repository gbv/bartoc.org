import { createApp } from "vue"

import ItemEditor from "./components/ItemEditor.vue"
import VocabularySearch from "./components/VocabularySearch.vue"
import ServiceLink from "./components/ServiceLink.vue"

import UserStatus from "./components/UserStatus.vue"
// Note: Using the JSON files directly because Lodash is used in config/index.js
import configDefault from "../config/config.default.json"
import configUser from "../config/config.json"
const login = Object.assign({}, configDefault.login, configUser.login || {})

import { render } from "../node_modules/timeago.js/"

const app = createApp({
  components: { UserStatus, ItemEditor, VocabularySearch, ServiceLink },
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
    render(document.querySelectorAll(".timeago"))
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
        fetch(url, { headers }).then(res => { this.userCanAdd = res.ok })
      } else {
        this.userCanAdd = false
      }
    },
  },
})
app.mount("#app")
