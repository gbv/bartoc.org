const config = require("../config")
const { existsSync, readFileSync } = require("fs")
const fm = require("front-matter")
const marked = require("marked")

module.exports = (req, res) => {
  const file = `${__dirname}/../pages/${req.params.page}.md`

  if (existsSync(file)) {
    const { attributes, body } = fm(readFileSync(file, "utf8"))
    const content = marked(body)
    const { path } = req
    res.setHeader("Content-Type", "text/html")
    res.render("page", { config, content, path, ...attributes, page: path.replace(/^\/|\/$/g, "") })
  } else {
    req.next()
  }
}
