import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // Express serves the production build from /dist/.
  base: command === "build" ? "/dist/" : "/",
  plugins: [vue()],
  build: {
    manifest: true,
    rollupOptions: {
      input: "/vue/main.js",
    },
  },
}))
