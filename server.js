const config = require("./config")

config.log(`Running in ${config.env} mode.`)

// Initialize express with settings
const express = require("express")
const app = express()
app.set("json spaces", 2)

// Configure view engine to render EJS templates.
app.set("views", __dirname + "/views")
app.set("view engine", "ejs")

// Root path for static page
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html")
  res.render("base", { config })
})

// BARTOC id
app.get("/en/:id", (req, res) => {
  res.setHeader("Content-Type", "text/html")
  let scheme = {
    prefLabel: { en: "Sample" }
  }
  res.render("vocabulary", { config, scheme })
})

// Start
app.listen(config.port, () => {
  config.log(`Now listening on port ${config.port}`)
})

module.exports = { app }
