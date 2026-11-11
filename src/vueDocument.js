import { serializeJsonForHtml } from "./utils.js"
import { pageFiles } from "../vue/pages/pageFiles.js"

const escapeHtml = value => String(value ?? "")
  .replace(/[<>&"']/g, character => `&#${character.charCodeAt(0)};`)

// Produce the asset tags for one server-rendered page. Development uses Vite's
// source modules; production uses the hashed files recorded by `vite build`.
function assetTags(config, page) {
  const prefix = config.vue.assetPrefix
  if (config.env === "development") {
    // Vite serves the entry module and injects its CSS while developing.
    // @vite/client handles hot updates without a production manifest.
    return `<script type="module" src="${escapeHtml(prefix)}@vite/client"></script>
    <script type="module" src="${escapeHtml(prefix)}vue/main.js"></script>`
  }

  // Manifest keys are source paths; values contain the built JS and CSS names.
  const manifest = config.vue.manifest
  if (!manifest?.["vue/main.js"]?.file) {
    throw new Error("Vite manifest is missing the vue/main.js entry")
  }
  const chunks = []
  const seen = new Set()
  // Keep chunks in insertion order and skip shared dependencies already found.
  function addChunk(name) {
    if (seen.has(name)) {
      return
    }
    const chunk = manifest?.[name]
    if (!chunk?.file) {
      throw new Error(`Vite manifest is missing the ${name} chunk`)
    }
    seen.add(name)
    chunks.push(chunk)
  }

  // The shared entry hydrates the page; pageFiles maps the SSR page name to
  // the matching browser component in the manifest.
  addChunk("vue/main.js")
  addChunk(`vue/pages/${pageFiles[page]}`)

  // Follow static imports of both chunks, including imports of their imports.
  // The list grows during this loop. Ignore dynamicImports because it lists
  // other possible pages, which should stay out of this response.
  for (let i = 0; i < chunks.length; i++) {
    for (const name of chunks[i].imports || []) {
      addChunk(name)
    }
  }

  // The first chunk is the entry script. Preload this page and its dependencies,
  // and send their CSS before the script so the SSR HTML is styled immediately.
  const [entry, ...preload] = chunks
  const styles = [...new Set(chunks.flatMap(chunk => chunk.css || []))]
  return [
    ...styles.map(file => `<link rel="stylesheet" href="${escapeHtml(prefix + file)}">`),
    `<script type="module" src="${escapeHtml(prefix + entry.file)}"></script>`,
    ...preload.map(chunk => `<link rel="modulepreload" href="${escapeHtml(prefix + chunk.file)}">`),
  ].join("\n")
}

// Wrap the Vue markup from renderToString in a complete HTML document.
// `page-state` passes the same data to the browser; `#app` holds the markup
// that Vue hydrates instead of rendering the page again from an empty element.
export function renderVueDocument({ config, title, item, stylesheets = [], scripts = [], state, html }) {
  const canonical = item?.uri?.match(/^https?:\/\/bartoc\.org/)
    ? `<link rel="canonical" href="${escapeHtml(item.uri)}">`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="shortcut icon" href="/img/bartoc-icon.png" type="image/png">
    <link rel="stylesheet" href="/css/base.css">
    <link rel="stylesheet" href="/css/layout.css">
    <link rel="stylesheet" href="/css/fontawesome.min.css">
    <link rel="stylesheet" href="/vendor/gbv-login-client-vue/style.css">
    <link rel="stylesheet" href="/vendor/bartoc-components/style.css">
    ${stylesheets.map(url => `<link rel="stylesheet" href="${escapeHtml(url)}">`).join("\n")}
    <title>${escapeHtml(config.name)}${title ? `: ${escapeHtml(title)}` : ""}</title>
    ${assetTags(config, state.page)}
    ${canonical}
  </head>
  <body>
    <script id="page-state" type="application/json">${serializeJsonForHtml(state)}</script>
    <noscript>
      <div class="cc-message cc-message--danger" role="alert">
        JavaScript needs to be enabled for this site to work properly.
      </div>
    </noscript>
    <div id="app">${html}</div>
    ${scripts.map(url => `<script src="${escapeHtml(url)}"></script>`).join("\n")}
  </body>
</html>`
}
