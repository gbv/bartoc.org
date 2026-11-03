import { createSSRApp } from "vue"
import { renderToString } from "vue/server-renderer"
import RegistryPage from "./pages/RegistryPage.vue"

export function renderRegistryPage(props) {
  return renderToString(createSSRApp(RegistryPage, props))
}
