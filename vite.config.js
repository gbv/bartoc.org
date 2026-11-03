import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { fileURLToPath } from "url"

import config from "./config/index.js"
const port = config.vue.port

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port,
  },
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./vue", import.meta.url)) },
      // Keep the browser compiler alias from matching vue/server-renderer.
      { find: /^vue$/, replacement: "vue/dist/vue.esm-bundler.js" },
    ],
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: "/vue/main.js",
    },
  },
})
