import { renderToString } from "vue/server-renderer"
import { createBartocApp } from "./appFactory.js"
import { pages } from "./pages/index.js"

// Express passes a page name and its data; return the HTML for that Vue page.
export async function renderVuePage({ page, pageProps = {}, footer = {}, header = {} }) {
  const pageComponent = pages[page]
  if (!pageComponent) {
    throw new Error(`Unknown Vue page: ${page}`)
  }

  const app = createBartocApp({ pageComponent, pageProps, footer, header })
  return renderToString(app)
}
