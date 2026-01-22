import express from "express"
const router = express.Router()

import fs from "fs"
import fm from "front-matter"
import { marked } from "marked"
import { URL } from "url"
const __dirname = new URL(".", import.meta.url).pathname

import config from "../config/index.js"

// Markdown pages as HTML
async function pageRoute(req, res) {
  const file = `${__dirname}/../pages/${req.params.page}.md`

  if (fs.existsSync(file)) {
    const { attributes, body } = fm(fs.readFileSync(file, "utf8"))
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
