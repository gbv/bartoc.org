import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

import config from "./config/index.js"
const port = config.vue.port

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port,
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: "/vue/main.js",
    },
  },
})
