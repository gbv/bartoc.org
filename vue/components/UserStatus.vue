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

<script setup>
import { computed, reactive, ref } from "vue"
import { LoginClient } from "gbv-login-client"

/**
 * Shows and manages login status.
 */
defineOptions({ name: "UserStatus" })

const props = defineProps({
  login: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["update:user", "update:auth"])

const connected = ref(false)
const user = ref(null)
const auth = reactive({})
const error = ref(null)
const client = new LoginClient(props.login.api, { ssl: props.login.ssl })

const loginUrl = computed(() => {
  let url = `http${props.login.ssl ? "s" : ""}://${props.login.api}`
  if (!url.endsWith("/")) {
    url += "/"
  }
  if (user.value) {
    url += "account"
  } else {
    url += "login?redirect_uri="
    url += encodeURIComponent(window.location.href)
  }
  return url
})

function updateAuth() {
  emit("update:auth", auth.token ? { ...auth } : null)
}

function setUser(nextUser) {
  user.value = nextUser
  emit("update:user", nextUser)
}

const { connect, disconnect, login: loginEvent, logout, update, token, about, error: errorEvent } = LoginClient.events

client.addEventListener(about, ({ publicKey }) => {
  auth.publicKey = publicKey
  updateAuth()
})
client.addEventListener(connect, () => {
  connected.value = true
})
client.addEventListener(disconnect, () => {
  connected.value = false
})
client.addEventListener(loginEvent, ({ user }) => {
  setUser(user)
})
client.addEventListener(update, ({ user }) => {
  setUser(user)
})
client.addEventListener(logout, () => {
  setUser(null)
})
client.addEventListener(token, ({ token }) => {
  auth.token = token
  updateAuth()
})
client.addEventListener(errorEvent, (event) => {
  if (event.error instanceof LoginClient.errors.ThirdPartyCookiesBlockedError) {
    error.value = "Login is not possible because third-party cookies are blocked."
  } else {
    error.value = "Login is not possible because connection failed."
  }
})
client.connect()
</script>
