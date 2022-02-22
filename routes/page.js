import express from "express"
const router = express.Router()

import fs from "fs"
import fm from "front-matter"
import { marked } from "marked"
import { URL } from "url"
const __dirname = new URL(".", import.meta.url).pathname

import config from "../config/index.js"

// Markdown pages as HTML
function pageRoute (req, res) {
  const file = `${__dirname}/../pages/${req.params.page}.md`

  if (fs.existsSync(file)) {
    const { attributes, body } = fm(fs.readFileSync(file, "utf8"))
    const content = marked.parse(body)
    const { path } = req
    res.setHeader("Content-Type", "text/html")
    res.render("page", { config, content, path, ...attributes, page: path.replace(/^\/|\/$/g, "") })
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
