// @vitest-environment jsdom
import path from "node:path"
import { fileURLToPath } from "node:url"
import ejs from "ejs"
import { describe, expect, it } from "vitest"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const startTemplate = path.join(rootDir, "views/layout-start.ejs")
const endTemplate = path.join(rootDir, "views/layout-end.ejs")

async function renderLayout(pathname = "/stats", locals = {}) {
  const data = {
    config: {
      name: "BARTOC.org",
      env: "development",
      vue: {
        assetPrefix: "/",
      },
    },
    title: "Statistics",
    path: pathname,
    ...locals,
  }
  const start = await ejs.renderFile(startTemplate, data)
  const end = await ejs.renderFile(endTemplate, data)
  return `${start}<p id="page-content">Page</p>${end}</body></html>`
}

describe("layout view", () => {
  it("leaves the Vue application shell to App.vue", async () => {
    document.documentElement.innerHTML = await renderLayout()

    const app = document.querySelector("#app")
    const stylesheetUrls = Array.from(document.querySelectorAll("link[rel='stylesheet']"))
      .map(link => link.getAttribute("href"))

    expect(stylesheetUrls).toContain("/vendor/gbv-login-client-vue/style.css")
    expect(stylesheetUrls).toContain("/vendor/bartoc-components/style.css")
    expect(document.querySelector("#header-app")).not.toBeNull()
    expect(document.querySelector("#footer-app")).not.toBeNull()
    expect(app.tagName).toBe("MAIN")
    expect(app.classList.contains("container")).toBe(true)
    expect(app.dataset.pagePath).toBe("/stats")
    expect(app.querySelector("#page-content").textContent).toBe("Page")
    expect(app.querySelector("bartoc-header")).toBeNull()
    expect(app.querySelector("the-header")).toBeNull()
    expect(app.querySelector("the-footer")).toBeNull()
  })

  it("includes page-specific stylesheets", async () => {
    document.documentElement.innerHTML = await renderLayout("/sparql", {
      stylesheets: [
        "/vendor/yasqe/yasqe.min.css",
        "/vendor/yasr/yasr.min.css",
      ],
    })

    const stylesheetUrls = Array.from(document.querySelectorAll("link[rel='stylesheet']"))
      .map(link => link.getAttribute("href"))

    expect(stylesheetUrls).toContain("/vendor/yasqe/yasqe.min.css")
    expect(stylesheetUrls).toContain("/vendor/yasr/yasr.min.css")
  })
})
