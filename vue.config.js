const config = require("./config")
const port = config.vue.port

module.exports = {
  // required for hot reloading
  publicPath: `http://localhost:${port}/`,
  devServer: {
    port,
    progress: false,
    // required because Express server runs on a different origin than Vue dev server
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  pages: {
    app: "vue/main.js",
  },
  filenameHashing: false,
  // prevent having separate .css files
  css: {
    extract: false,
  },
  // required for in-DOM templates
  runtimeCompiler: true,
}
