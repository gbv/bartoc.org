// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { createBartocApp } from "../../vue/appFactory.js"
import { renderVuePage } from "../../vue/entry-server.js"
import { pages } from "../../vue/pages/index.js"

describe("Vue SSR hydration", () => {
  it("renders the home search with the server count", async () => {
    const html = await renderVuePage({
      page: "home",
      pageProps: { schemesCount: 144 },
      header: { activePath: "/" },
    })

    expect(html).toContain("/img/bartoc-logo.svg")
    expect(html).toContain("Search in metadata about")
    expect(html).toContain("144")
    expect(html).toContain("href=\"/vocabularies\"")
    expect(html).toContain("href=\"/registries\"")
    expect(html).toContain("Loading account…")
  })

  it("renders the about sections, logos, and publications on the server", async () => {
    const html = await renderVuePage({
      page: "about",
      header: { activePath: "/about" },
    })

    expect(html).toContain("Basic Register of Thesauri")
    expect(html).toContain("/img/logo-isko.png")
    expect(html).toContain("NKOS 2022")
  })

  it("renders the contact sections and editor links on the server", async () => {
    const html = await renderVuePage({
      page: "contact",
      header: { activePath: "/contact" },
    })

    expect(html).toContain("Contact at the Head Office (VZG)")
    expect(html).toContain("International Editors")
    expect(html).toContain("mailto:balakrishnan@gbv.de")
    expect(html).toContain("https://orcid.org/0000-0002-6076-9853")
    expect(html).toContain("href=\"/contributing\"")
  })

  it("renders the software links on the server", async () => {
    const html = await renderVuePage({
      page: "software",
      header: { activePath: "/software" },
    })

    expect(html).toContain("Many software tools exist")
    expect(html).toContain("https://gbv.github.io/bartoc-vocabulary-software/")
    expect(html).toContain("https://doi.org/10.5281/zenodo.15672523")
  })

  it("renders the download sections and links on the server", async () => {
    const html = await renderVuePage({
      page: "download",
      header: { activePath: "/download" },
    })

    expect(html).toContain("Linked Open Data (RDF)")
    expect(html).toContain("JSKOS format")
    expect(html).toContain("/data/dumps/latest.ndjson")
    expect(html).toContain("/api/registries?limit=10000")
  })

  it("renders the contributing content and editor links on the server", async () => {
    const html = await renderVuePage({
      page: "contributing",
      header: { activePath: "/contributing" },
    })

    expect(html).toContain("Technical infrastructure")
    expect(html).toContain("BARTOC Content")
    expect(html).toContain("href=\"/edit\"")
    expect(html).toContain("href=\"/download\"")
  })

  it("renders the top-rated-points placeholder on the server", async () => {
    const html = await renderVuePage({ page: "topRatedPoints" })
    expect(html).toContain("Not implemented yet...")
  })

  it.each([
    { page: "notFound", pageProps: {} },
    { page: "home", pageProps: { schemesCount: 144 } },
    { page: "about", pageProps: {} },
    { page: "contact", pageProps: {} },
    { page: "software", pageProps: {} },
    { page: "download", pageProps: {} },
    { page: "contributing", pageProps: {} },
    { page: "topRatedPoints", pageProps: {} },
    {
      page: "registry",
      pageProps: {
        title: "Example registry",
        item: { uri: "http://bartoc.org/en/node/18605", type: ["http://www.w3.org/ns/dcat#Catalog"] },
      },
    },
    {
      page: "terminology",
      pageProps: {
        title: "Example vocabulary",
        item: { uri: "http://bartoc.org/en/node/100", type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"] },
      },
    },
  ])("hydrates $page, header, and footer without replacing their markup", async ({ page, pageProps }) => {
    const footer = { siteName: "BARTOC.org", resourcePath: "/missing", query: {} }
    const header = { activePath: "/missing", userCanAdd: false }
    const html = await renderVuePage({ page, pageProps, footer, header })
    document.body.innerHTML = `<div id="app">${html}</div>`

    const heading = document.querySelector("#app h1")
    const headerElement = document.querySelector("#app header")
    const mainElement = document.querySelector("#app main")
    const footerElement = document.querySelector("#app footer")
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

    const app = createBartocApp({
      pageComponent: pages[page],
      pageProps,
      footer,
      header,
    })
    try {
      app.mount("#app")
      expect(document.querySelector("#app h1")).toBe(heading)
      expect(document.querySelector("#app header")).toBe(headerElement)
      expect(document.querySelector("#app main")).toBe(mainElement)
      expect(document.querySelector("#app footer")).toBe(footerElement)
      expect(warn.mock.calls.flat().join(" ")).not.toMatch(/hydration mismatch/i)
    } finally {
      app.unmount()
      warn.mockRestore()
    }
  })
})
