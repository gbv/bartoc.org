import { createApp } from "vue"

import { ItemEditor, VocabularySearch, ApiUrl } from "./components"
import UserStatus from "./components/UserStatus.vue"
// Note: Using the JSON files directly because Lodash is used in config/index.js
import configDefault from "../config/config.default.json"
import configUser from "../config/config.json"
const login = Object.assign({}, configDefault.login, configUser.login || {})

const app = createApp({
  components: { UserStatus, ItemEditor, VocabularySearch, ApiUrl },
  data() {
    return {
      login,
      user: null,
      userCanAdd: false,
      auth: null,
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
        fetch(url, { headers }).then(res => { this.userCanAdd = res.ok })
      } else {
        this.userCanAdd = false
      }
    },
  },
})
app.mount("#app")
