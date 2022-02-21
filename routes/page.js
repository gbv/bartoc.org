import config from "../config/index.js"
import { existsSync, readFileSync } from "fs"
import fm from "front-matter"
import { marked } from "marked"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default (req, res) => {
  const file = `${__dirname}/../pages/${req.params.page}.md`

  if (existsSync(file)) {
    const { attributes, body } = fm(readFileSync(file, "utf8"))
    const content = marked.parse(body)
    const { path } = req
    res.setHeader("Content-Type", "text/html")
    res.render("page", { config, content, path, ...attributes, page: path.replace(/^\/|\/$/g, "") })
  } else {
    req.next()
  }
}
