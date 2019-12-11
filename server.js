const config = require("./config")
const page = require('./routes/page')

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

// permanently moved URLs from old BARTOC.org
app.get("/en/content/about", (req, res) => { res.redirect(301, '/about') })
app.get("/en", (req, res) => { res.redirect(301, '/') })

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

// BARTOC id
app.get("/en/node/:id([0-9]+)", (req, res) => {

  res.setHeader("Content-Type", "text/html")
  let scheme = {
    prefLabel: { en: "Sample" }
  }

  const { path } = req
  const title = "Example record"

  res.render("vocabulary", { config, scheme, title, path })
})

// Redirect non-English URLs to English URL pattern
app.get("/([a-z][a-z])/node/:id", (req, res) => {
  res.redirect(`/en/${req.params.id}`)
})

// Start
app.listen(config.port, () => {
  config.log(`Now listening on port ${config.port}`)
})

module.exports = { app }
