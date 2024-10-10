<template>
  <a
    v-if="connected"
    class="nav-link"
    :href="loginUrl">
    {{ user ? user.name : 'login' }}
  </a>
  <a
    v-else
    class="nav-link"
    :title="error"
    style="text-decoration: line-through">login
  </a>
</template>

<script>
import { LoginClient } from "gbv-login-client"

/**
 * Shows and manages login status.
 */
export default {
  name: "UserStatus",
  props: {
    login: {
      type: Object,
      required: true,
    },
  },
  emits: ["update:user", "update:auth"],
  data () {
    return {
      client: new LoginClient(this.login.api, { ssl: this.login.ssl }),
      connected: false,
      user: null,
      auth: {},
      error: null,
    }
  },
  computed: {
    loginUrl() {
      let url = `http${this.login.ssl ? "s" : ""}://${this.login.api}`
      if (!url.endsWith("/")) {
        url += "/"
      }
      if (this.user) {
        url += "account"
      } else {
        url += "login?redirect_uri="
        url += encodeURIComponent(window.location.href)
      }
      return url
    },
  },
  created () {
    const { connect, disconnect, login, logout, update, token, about, error } = LoginClient.events
    this.client.addEventListener(about, ({ publicKey }) => {
      this.auth.publicKey = publicKey; this._updateAuth()
    })
    this.client.addEventListener(connect, () => {
      this.connected = true
    })
    this.client.addEventListener(disconnect, () => {
      this.connected = false
    })
    this.client.addEventListener(login, ({ user }) => {
      this._setUser(user)
    })
    this.client.addEventListener(update, ({ user }) => {
      this._updadeUser(user)
    })
    this.client.addEventListener(logout, () => {
      this._setUser(null)
    })
    this.client.addEventListener(token, ({ token }) => {
      this.auth.token = token; this._updateAuth()
    })
    this.client.addEventListener(error, (e) => {
      if (e.error instanceof LoginClient.errors.ThirdPartyCookiesBlockedError) {
        this.error = "Login is not possible because third-party cookies are blocked."
      } else {
        this.error = "Login is not possible because connection failed."
      }
    })
    this.client.connect()
  },
  methods: {
    _updateAuth () {
      this.$emit("update:auth", this.auth.token ? this.auth : null)
    },
    _setUser (user) {
      this.user = user
      this.$emit("update:user", user)
    },
  },
}
</script>
