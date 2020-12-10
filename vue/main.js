import { createApp } from "vue"

import { ItemEditor, VocabularySearch, ApiUrl } from "./components"
import UserStatus from "./components/UserStatus.vue"

const app = createApp({
  components: { UserStatus, ItemEditor, VocabularySearch, ApiUrl },
  data() {
    return {
      login: "coli-conc.gbv.de/login/",
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
