import gbv from "eslint-config-gbv"
import vue from "eslint-config-gbv/vue"

export default [
  ...gbv,
  ...vue,
  {
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/v-on-event-hyphenation": "off",
    },
  },
]
