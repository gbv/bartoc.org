import { createSSRApp, markRaw } from "vue"
import { library } from "@fortawesome/fontawesome-svg-core"
import { faLanguage } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { Login } from "gbv-login-client-vue"
import App from "./App.vue"

library.add(faLanguage)

// Use the same app setup for server rendering and browser hydration.
// Create a fresh app for each page so requests do not share Vue state.
export function createBartocApp({ pageComponent, pageProps = {}, footer = {}, header = {} }) {
  // Keep the component definition out of Vue's reactive data.
  const app = createSSRApp(App, { pageComponent: markRaw(pageComponent), pageProps })
  // The shared header and footer read these values through Vue injection.
  app.provide("footer", footer)
  app.provide("header", header)
  app.use(Login)
  app.component("FontAwesomeIcon", FontAwesomeIcon)
  return app
}
