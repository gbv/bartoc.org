<template>
  <BartocHeader
    :site-name="siteName"
    home-url="./"
    logo-url="/img/bartoc-logo-new.png"
    logo-alt="BARTOC"
    :nav-links="navLinks"
    :utility-links="utilityLinks"
    :active-path="activePath"
    :user-can-add="userCanAdd"
    edit-url="/edit"
    add-label="add">
    <template #user-status>
      <UserStatus redirect />
    </template>
  </BartocHeader>
</template>

<script setup>
import { computed, inject, unref } from "vue"
import { BartocHeader } from "@gbv/bartoc-components"
import { UserStatus } from "gbv-login-client-vue"
import configDefault from "../../config/config.default.json"

defineOptions({ name: "TheHeader" })

const providedHeader = inject("header", {})
const props = defineProps({
  activePath: {
    type: String,
    default: "",
  },
  userCanAdd: {
    type: Boolean,
    default: undefined,
  },
})

const configuredMenu = configDefault.menu || []
const siteName = configDefault.name || "BARTOC.org"

const navLinks = configuredMenu.map(item => ({
  href: item.url,
  label: item.prefLabel.en,
}))
const utilityLinks = [
  { href: "/contact", label: "Contact & Editors" },
]
const activePath = computed(() => (
  props.activePath || providedHeader.activePath || window.location.pathname
))
const userCanAdd = computed(() => (
  props.userCanAdd ?? unref(providedHeader.userCanAdd) ?? false
))
</script>
