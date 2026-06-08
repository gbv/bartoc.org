import { describe, it, expect } from "vitest"
import ejs from "ejs"
import path from "path"
import querystring from "querystring"
import { JSDOM } from "jsdom"
import { fileURLToPath } from "url"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const template = path.join(rootDir, "views/vocabulary.ejs")

// Minimal locals required by vocabulary.ejs and its included partials.
const viewLocals = {
  config: {
    name: "BARTOC",
    env: "development",
    baseUrl: "https://bartoc.org",
    menu: [],
    vue: {
      assetPrefix: "/",
    },
  },
  query: {},
  path: "/en/node/123",
  querystring,
  nkostypes: {},
  accesstypes: {},
  formats: {},
  page: "en/node/123",
  utils: {
    escapeXML: value => String(value).replace(/[<>&"']/g, char => `&#${char.charCodeAt(0)};`),
    isBartocUri: uri => /^http:\/\/bartoc.org\/en\/node\/[1-9][0-9]+$/.test(uri),
    label(labels, language, fallback = "") {
      const code = language || "en"
      return {
        code,
        value: labels?.[code] || fallback,
      }
    },
  },
}

function tableRowsByLabel(html) {
  const document = new JSDOM(html).window.document

  return Object.fromEntries(
    [...document.querySelectorAll("tr")]
      .map(row => [...row.querySelectorAll("td")].map(cell => cell.textContent.trim()))
      .filter(cells => cells.length >= 2)
      .map(([label, content]) => [label, content]),
  )
}

function renderVocabulary(item) {
  return ejs.renderFile(template, {
    ...viewLocals,
    item,
    title: item.prefLabel.en,
  })
}

function subject(label, notation, extra = {}) {
  return {
    uri: `http://bartoc.org/en/node/${notation}`,
    prefLabel: { en: label },
    notation: [notation],
    ...extra,
  }
}

describe("vocabulary view", () => {
  it("shows derived subjects in a separate row", async () => {
    const html = await renderVocabulary({
      uri: "http://bartoc.org/en/node/123",
      prefLabel: { en: "Test Vocabulary" },
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
      subject: [
        subject("Manual Subject", "100"),
        subject("Derived Subject", "200", {
          MAPPING: [{ uri: "mapping:1" }],
        }),
      ],
    })

    // Manual and derived subjects should render in separate table rows.
    const rows = tableRowsByLabel(html)

    expect(rows.Subject).toContain("Manual Subject (100)")
    expect(rows.Subject).not.toContain("Derived Subject (200)")
    expect(rows["Derived Subjects"]).toContain("Derived Subject (200)")
    expect(rows["Derived Subjects"]).not.toContain("Manual Subject (100)")
  })
})
