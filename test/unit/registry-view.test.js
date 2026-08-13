import { describe, it, expect } from "vitest"
import ejs from "ejs"
import path from "path"
import querystring from "querystring"
import { JSDOM } from "jsdom"
import { fileURLToPath } from "url"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const template = path.join(rootDir, "views/registry.ejs")

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
  path: "/registries",
  querystring,
  page: "en/node/18605",
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

function renderRegistry(item) {
  return ejs.renderFile(template, {
    ...viewLocals,
    item,
    title: item.prefLabel.en,
  })
}

describe("registry view", () => {
  it("mounts the frontend vocabulary list for the registry", async () => {
    const html = await renderRegistry({
      uri: "http://bartoc.org/en/node/18605",
      prefLabel: { en: "agINFRA Linked Data Vocabularies" },
      type: [
        "http://www.w3.org/ns/dcat#Catalog",
        "http://bartoc.org/full-repository",
      ],
      identifier: ["https://example.org/registry"],
      created: "2024-01-02",
    })

    const document = new JSDOM(html).window.document
    const component = document.querySelector("registry-vocabularies")
    const identifierList = document.querySelector(".registry-metadata-list")
    const dateList = document.querySelector(".item-dates")

    expect(component.getAttribute("registry-uri")).toBe("http://bartoc.org/en/node/18605")
    expect(identifierList.textContent).toContain("https://example.org/registry")
    expect(dateList.classList.contains("separated-list")).toBe(true)
  })
})
