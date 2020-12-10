<template>
  <a
    v-if="connected"
    class="nav-link"
    :href="'https://'+login+'account'">
    {{ user ? user.name : 'login' }}
  </a>
</template>

<script>
import LoginClient from "gbv-login-client"

export default {
  name: "UserStatus",
  props: {
    login: {
      type: String,
      required: true,
    },
  },
  emits: ["update:user", "update:auth"],
  data () {
    return {
      client: new LoginClient(this.login),
      connected: false,
      user: null,
      auth: {},
    }
  },
  created () {
    const { connect, disconnect, login, logout, update, token, about } = LoginClient.events
    this.client.addEventListener(about, ({ publicKey }) => { this.auth.publicKey = publicKey; this._updateAuth() })
    this.client.addEventListener(connect, () => { this.connected = true })
    this.client.addEventListener(disconnect, () => { this.connected = false })
    this.client.addEventListener(login, ({ user }) => { this._setUser(user) })
    this.client.addEventListener(update, ({ user }) => { this._updadeUser(user) })
    this.client.addEventListener(logout, () => { this._setUser(null) })
    this.client.addEventListener(token, ({ token }) => { this.auth.token = token; this._updateAuth() })
    // this.client.addEventListener(error, console.warn)
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
