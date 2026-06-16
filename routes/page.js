import express from "express"
const router = express.Router()

import fs from "fs"
import { load as loadYaml } from "js-yaml"
import { marked } from "marked"
import { URL } from "url"
const __dirname = new URL(".", import.meta.url).pathname

import config from "../config/index.js"

// Extract the optional YAML front matter block used by pages/*.md. The
// remaining text stays Markdown and is rendered below with marked.
export function parseFrontMatter(content) {
  // Match a leading block delimited by "---" lines, as used in pages/*.md.
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) {
    return { attributes: {}, body: content }
  }

  return {
    attributes: loadYaml(match[1]) || {},
    // Drop the matched metadata block and keep only the Markdown page content.
    body: content.slice(match[0].length),
  }
}

// Markdown pages as HTML
async function pageRoute(req, res) {
  const file = `${__dirname}/../pages/${req.params.page}.md`

  if (fs.existsSync(file)) {
    const { attributes, body } = parseFrontMatter(fs.readFileSync(file, "utf8"))
    let content = marked.parse(body)
    const { path } = req

    // Only on home page: inject schemesCount into <vocabulary-search ...>
    if (req.params.page === "index") {
      const schemes = await config.registry.getSchemes({
        params: { limit: 1 },
      })
      const schemesCount = schemes?._totalCount ?? 0

      content = content.replace(
        /<vocabulary-search\b[^>]*><\/vocabulary-search>/,
        `<vocabulary-search schemes-count="${schemesCount}"></vocabulary-search>`,
      )
    }

    res.setHeader("Content-Type", "text/html")
    res.render("page", {
      config,
      content,
      path,
      ...attributes,
      page: path.replace(/^\/|\/$/g, ""),
    })
  } else {
    req.next()
  }
}

router.get("/:page([a-z-]+)", pageRoute)
router.get("/", (req, res) => {
  req.params = { page: "index" }
  pageRoute(req, res)
})

export default router
