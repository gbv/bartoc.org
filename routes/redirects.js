// Make sure best as we can that old URLs don't break

import express from "express"
const router = express.Router()

import fs from "fs"
import { URL } from "url"
const __dirname = new URL(".", import.meta.url).pathname

const readJSON = file => JSON.parse(fs.readFileSync(`${__dirname}${file}`))
const readCsv = file => fs.readFileSync(file).toString()
  .split(/\n|\n\r/).filter(Boolean).map(row => row.split(","))


// redirect permanently moved URLs from legacy BARTOC.org
const redirects = readJSON("../data/redirects.json")
for (const [from, to] of Object.entries(redirects)) {
  router.get(from, (req, res) => res.redirect(301, to))
}

// redirect non-language URLs to English URLs
router.get("/node/:id([0-9]+)", (req, res) => {
  res.redirect(`/en/node/${req.params.id}`)
})

// redirect non-English URLs to English URLs
router.get("/:lang([a-z][a-z])/node/:id([0-9]+)", (req, res, next) => {
  const { lang, id } = req.params
  if (lang === "en") {
    next()
  } else {
    res.redirect(`/en/node/${id}`)
  }
})

// Redirect pages prefixed with language tag to base
router.get("/([a-z][a-z])/:page([a-z-]+)", (req, res) => {
  res.redirect(`/${req.params.page}`)
})

// Redirec ILC1 URL to its URI
router.get("/ILC/1", (req, res) => res.redirect("/en/node/472"))

// Redirect local vocabulary URIs to URI search
router.get("/en/Format/:id([a-zA-Z0-9_-]+)", (req, res) =>
  res.redirect(`/?uri=http://bartoc.org/en/Format/${req.params.id}`))
router.get("/language/:id([a-z]{2,3})", (req, res) =>
  res.redirect(`/?uri=http://bartoc.org/language/${req.params.id}`))

// redirect old subject URLs to vocabulary search

for (const [url, uri] of readCsv("./data/eurovoc-ids.csv")) {
  router.get(url, (req, res) => res.redirect(`/vocabularies?subject=${uri}`))
}

for (const [url, uri] of readCsv("./data/ddc-ids.csv")) {
  router.get(url, (req, res) => res.redirect(`/vocabularies?subject=${uri}`))
}

for (const [url, code] of readCsv("./data/language-ids.csv")) {
  router.get(url, (req, res) => res.redirect(`/language/${code}`))
}

for (const [url, uri] of readCsv("./data/kostype-ids.csv")) {
  router.get(url, (req, res) => res.redirect(`/vocabularies?type=${uri}`))
}

for (const [url, uri] of readCsv("./data/license-ids.csv")) {
  router.get(url, (req, res) => res.redirect(`/vocabularies?license=${uri}`))
}

for (const [url, uri] of readCsv("./data/access-ids.csv")) {
  router.get(url, (req, res) => res.redirect(`/vocabularies?access=${uri}`))
}

for (const [url, id] of readCsv("./data/format-ids.csv")) {
  router.get(url, (req, res) => res.redirect(`/vocabularies?format=http://bartoc.org/en/Format/${id}`))
}

export default router
