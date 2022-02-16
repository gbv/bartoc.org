module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "gbv",
    "gbv/vue/3",
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
    parser: "babel-eslint",
  },
  rules: {
    "vue/multi-word-component-names": "off",
    "vue/v-on-event-hyphenation": "off",
    "template-curly-spacing": "off",
    indent: [
      "warn",
      2,
      {
        ignoredNodes: ["TemplateLiteral"],
        SwitchCase: 1,
      },
    ],
  },
}
