import { describe, it, expect } from "vitest"
import { JSDOM } from "jsdom"
import { renderVuePage } from "../../vue/entry-server.js"

describe("registry page", () => {
  it("renders the registry metadata and vocabulary search link on the server", async () => {
    const uri = "http://bartoc.org/en/node/18605"
    const html = await renderVuePage({
      page: "registry",
      pageProps: {
        title: "agINFRA Linked Data Vocabularies",
        item: {
          uri,
          type: [
            "http://www.w3.org/ns/dcat#Catalog",
            "http://bartoc.org/full-repository",
          ],
          definition: { en: ["A registry of vocabularies."] },
          identifier: ["https://example.org/registry"],
          subject: [{ uri: "http://example.org/subject", prefLabel: { en: "Agriculture" } }],
          created: "2024-01-02",
        },
      },
      header: { activePath: "/registries", userCanAdd: false },
      footer: { siteName: "BARTOC.org", itemUri: uri, resourcePath: "/en/node/18605" },
    })

    const document = new JSDOM(html).window.document
    expect(document.querySelector("h1").textContent).toBe("agINFRA Linked Data Vocabularies")
    expect(document.querySelector("p[lang='en']").textContent).toBe("A registry of vocabularies.")
    expect(document.querySelector(".metadata-list").textContent).toContain("https://example.org/registry")
    expect(document.querySelector("a[href='http://example.org/subject']").textContent).toBe("Agriculture")
    expect(document.body.textContent).toContain("This is a terminology repository.")
    expect(document.querySelector("a[href^='/vocabularies?partOf=']").getAttribute("href"))
      .toContain(encodeURIComponent(uri))
    expect(document.querySelector(".item-dates time").getAttribute("datetime")).toBe("2024-01-02")
    expect(document.querySelector("header").textContent).toContain("BARTOC")
    expect(document.querySelector("footer").textContent).toContain("RDF")
  })
})
