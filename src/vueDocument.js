import { serializeJsonForHtml } from "./utils.js"

const escapeHtml = value => String(value ?? "")
  .replace(/[<>&"']/g, character => `&#${character.charCodeAt(0)};`)

// Load source files from Vite in development and built files from its manifest.
function assetTags(config) {
  const prefix = config.vue.assetPrefix
  if (config.env === "development") {
    return `<script type="module" src="${escapeHtml(prefix)}@vite/client"></script>
    <script type="module" src="${escapeHtml(prefix)}vue/main.js"></script>`
  }

  const manifest = config.vue.manifest || {}
  const entry = manifest["vue/main.js"] || {}
  const chunks = [entry, ...(entry.imports || []).map(name => manifest[name] || {})]
  return chunks.flatMap(chunk => [
    ...(chunk.file ? [`<script type="module" src="${escapeHtml(prefix + chunk.file)}"></script>`] : []),
    ...(chunk.css || []).map(file => `<link rel="stylesheet" href="${escapeHtml(prefix + file)}">`),
  ]).join("\n")
}

// Wrap the server-rendered Vue page with the shared document shell.
// Embed escaped page data so the browser can hydrate the same content.
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
    ${assetTags(config)}
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
