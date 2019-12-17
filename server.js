const config = require("./config")
const page = require('./routes/page')

// static data
const registries = require('./static/terminology-registries')

config.log(`Running in ${config.env} mode.`)

// Initialize express with settings
const express = require("express")
const app = express()
app.set("json spaces", 2)

// Configure view engine to render EJS templates.
app.set("views", __dirname + "/views")
app.set("view engine", "ejs")

// static assets
app.use(express.static('static'))

// permanently moved URLs from legacy BARTOC.org
for (const [from, to] of Object.entries(config.redirects)) {
  app.get(from, (req, res) => { res.redirect(301, to) })
}

// root page
app.get("/", (req, res) => {
  req.params = { page: 'index' }
  page(req, res)
})

// pages
app.get("/:page([a-z-]+)", page)
app.get("/([a-z][a-z])/:page([a-z-]+)", (req, res) => {
  res.redirect(`/${req.params.page}`)
})

app.get("/terminology-registries", (req, res) => {
  res.setHeader("Content-Type", "text/html")
  const { path } = req
  const title = registries.prefLabel.en
  res.render("registries", { config, registries, title, path })
})

// BARTOC id
app.get("/en/node/:id([0-9]+)", (req, res, next) => {
  const { path } = req
  const uri = 'http://bartoc.org/en/node/' + req.params.id

  // lookup URI as registry
  var item = registries.registries.find(item => item.uri == uri)
  if (item) {
    res.setHeader("Content-Type", "text/html")
    const title = item.prefLabel.en
    res.render("registry", { config, item, title, path })
  }

  // TODO: lookup URI as terminology
  res.setHeader("Content-Type", "text/html")
  item = {
    prefLabel: { en: "Dummy record" },
    definition: { en: ["this record is only shown for testing"] }
  }
  const title = item.prefLabel.en
  res.render("vocabulary", { config, item, title, path })

  next()
})

// Redirect non-English URLs to English URL pattern
app.get("/:lang([a-z][a-z])/node/:id([0-9]+)", (req, res, next) => {
  const { lang, id } = req.params
  if (lang === "en") {
    next()
  } else {
    res.redirect(`/en/node/${id}`)
  }
})

// Start
app.listen(config.port, () => {
  config.log(`Now listening on port ${config.port}`)
})

module.exports = { app }
