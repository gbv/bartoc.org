import { describe, expect, it, vi } from "vitest"
import { JSDOM } from "jsdom"

vi.mock("../../config/index.js", () => ({ default: {} }))

import { renderVueDocument } from "../../src/vueDocument.js"

const pageHtml = "<header>Header</header><main><h1>Registry</h1><p>Registry metadata</p></main><footer>Footer</footer>"

describe("Vue document", () => {
  it("includes the Vue page and safely serialized state", () => {
    const state = {
      page: "registry",
      pageProps: { title: "Broken </script><script>alert('xss')</script>" },
      footer: { siteName: "BARTOC.org" },
      header: { activePath: "/registries" },
    }
    const html = renderVueDocument({
      config: { name: "BARTOC.org", env: "development", vue: { assetPrefix: "/" } },
      title: "Registry",
      item: { uri: "http://bartoc.org/en/node/18605" },
      state,
      html: pageHtml,
    })

    const document = new JSDOM(html).window.document
    expect(document.title).toBe("BARTOC.org: Registry")
    expect(document.querySelector("#app main h1").textContent).toBe("Registry")
    expect(document.querySelector("#app header").textContent).toBe("Header")
    expect(document.querySelector("#app footer").textContent).toBe("Footer")
    expect(document.querySelector("link[rel='canonical']").getAttribute("href"))
      .toBe("http://bartoc.org/en/node/18605")
    expect(document.querySelector("script[src='/vue/main.js']")).not.toBeNull()

    const stateElement = document.querySelector("#page-state")
    expect(stateElement.textContent).not.toContain("</script>")
    expect(JSON.parse(stateElement.textContent)).toEqual(state)
  })

  it("includes built assets and route-specific SPARQL resources", () => {
    const html = renderVueDocument({
      config: {
        name: "BARTOC.org",
        env: "production",
        vue: {
          assetPrefix: "/dist/",
          manifest: {
            "vue/main.js": {
              file: "assets/main.js",
              css: ["assets/main.css"],
              imports: ["_shared.js"],
            },
            "_shared.js": { file: "assets/shared.js", css: ["assets/shared.css"] },
          },
        },
      },
      title: "SPARQL Query",
      stylesheets: ["/vendor/yasgui/yasgui.min.css"],
      scripts: ["/vendor/yasgui/yasgui.min.js"],
      state: { page: "sparql", pageProps: {} },
      html: pageHtml,
    })

    const document = new JSDOM(html).window.document
    expect(document.querySelector("script[src='/dist/assets/main.js']")).not.toBeNull()
    expect(document.querySelector("link[href='/dist/assets/main.css']")).not.toBeNull()
    expect(document.querySelector("link[href='/dist/assets/shared.css']")).not.toBeNull()
    expect(document.querySelector("link[rel='modulepreload'][href='/dist/assets/shared.js']")).not.toBeNull()
    expect(html.indexOf("assets/main.css")).toBeLessThan(html.indexOf("assets/main.js"))
    expect(html.indexOf("assets/shared.css")).toBeLessThan(html.indexOf("assets/main.js"))
    expect(document.querySelector("link[href='/vendor/yasgui/yasgui.min.css']")).not.toBeNull()
    expect(document.querySelector("script[src='/vendor/yasgui/yasgui.min.js']")).not.toBeNull()
  })

  it("fails when the production manifest has no browser entry", () => {
    expect(() => renderVueDocument({
      config: { name: "BARTOC.org", env: "production", vue: { assetPrefix: "/dist/", manifest: {} } },
      state: { page: "about" },
      html: pageHtml,
    })).toThrow("Vite manifest is missing the vue/main.js entry")
  })
})
