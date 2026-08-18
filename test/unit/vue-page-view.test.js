// @vitest-environment jsdom
import path from "node:path"
import { fileURLToPath } from "node:url"
import ejs from "ejs"
import { describe, expect, it, vi } from "vitest"
import { serializeJsonForHtml } from "../../src/utils.js"

vi.mock("../../config/index.js", () => ({
  default: {
    backend: {
      api: "https://example.org/",
    },
  },
}))

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const template = path.join(rootDir, "views/vue-page.ejs")

describe("Vue page view", () => {
  it("exposes the selected page to the client entry", async () => {
    const html = await ejs.renderFile(template, {
      config: {
        name: "BARTOC.org",
        env: "development",
        vue: {
          assetPrefix: "/",
        },
      },
      title: "Missing bartoc-search",
      path: "/vocabularies",
      vuePage: "missingSearch",
    })

    document.documentElement.innerHTML = html

    const app = document.querySelector("#app")
    expect(document.title).toBe("BARTOC.org: Missing bartoc-search")
    expect(app.dataset.page).toBe("missingSearch")
    expect(app.dataset.pagePath).toBe("/vocabularies")
  })

  it("embeds safely serialized props for the selected page", async () => {
    const pageProps = {
      title: "Broken </script><script>alert('xss')</script>",
      message: "Error: broken",
      derivedFields: {
        definition: { from: "http://bartoc.org/en/node/21133" },
      },
    }
    const html = await ejs.renderFile(template, {
      config: {
        name: "BARTOC.org",
        env: "development",
        vue: {
          assetPrefix: "/",
        },
      },
      title: pageProps.title,
      path: "/broken",
      vuePage: "error",
      vuePagePropsJson: serializeJsonForHtml(pageProps),
    })

    document.documentElement.innerHTML = html

    const propsElement = document.querySelector("#page-props")
    expect(propsElement).not.toBeNull()
    expect(propsElement.textContent).not.toContain("</script>")
    expect(JSON.parse(propsElement.textContent)).toEqual(pageProps)
  })
})
