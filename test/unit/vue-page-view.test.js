// @vitest-environment jsdom
import path from "node:path"
import { fileURLToPath } from "node:url"
import ejs from "ejs"
import { describe, expect, it } from "vitest"

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
})
