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
    alias: {
      "@": fileURLToPath(new URL("./vue", import.meta.url)),
      vue: "vue/dist/vue.esm-bundler.js",
    },
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: "/vue/main.js",
    },
  },
})
