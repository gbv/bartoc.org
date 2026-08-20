<template>
  <a
    class="cc-button cc-button-secondary page-action"
    :href="cancelUrl">
    cancel
  </a>
  <h1>{{ title }}</h1>

  <ItemEditor
    :user="user"
    :auth="auth"
    :current="currentItem"
    :version-main="versionMain"
    :has-incoming-versions="hasIncomingVersions" />
</template>

<script setup>
import { computed, inject, unref } from "vue"
import ItemEditor from "../components/ItemEditor.vue"

defineOptions({ name: "EditPage" })

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  item: {
    type: Object,
    default: null,
  },
  versionMain: {
    type: Object,
    default: null,
  },
  cancelUrl: {
    type: String,
    required: true,
  },
  hasIncomingVersions: {
    type: Boolean,
    default: false,
  },
})

const login = inject("login-refs", {})
const auth = computed(() => {
  const token = unref(login.token)
  return token ? { token } : null
})
const user = computed(() => unref(login.user))
const currentItem = computed(() => props.item || {})
</script>
