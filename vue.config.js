import config from "./config/index.js"

const port = config.vue.port

export default {
  // required for hot reloading
  publicPath: `http://localhost:${port}/`,
  devServer: {
    port,
    // required because Express server runs on a different origin than Vue dev server
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  pages: {
    // required because we're using an unusual path
    app: "vue/main.js",
  },
  // don't add hashing so that the generated filenames don't change
  filenameHashing: false,
  css: {
    // prevent having separate .css files
    extract: false,
  },
  // required for in-DOM templates
  runtimeCompiler: true,
}
