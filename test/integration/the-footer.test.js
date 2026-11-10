// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import TheFooter from "../../vue/components/TheFooter.vue"

function linksByLabel(wrapper) {
  return Object.fromEntries(
    wrapper.findAll("a").map(link => [
      link.text(),
      link.attributes("href"),
    ]),
  )
}

describe("TheFooter Component", () => {
  it("shows global footer links", () => {
    const wrapper = mount(TheFooter, {
      props: {
        siteName: "BARTOC",
      },
    })

    const links = linksByLabel(wrapper)

    expect(links.API).toBe("/api/")
    expect(links.download).toBe("/download")
    expect(links.SPARQL).toBe("/graph/")
    expect(links.Mastodon).toBe("https://code4lib.social/@bartoc")
    expect(links["BARTOC sources"]).toBe("https://github.com/gbv/bartoc.org")
    expect(links.issues).toBe("https://github.com/gbv/bartoc.org/issues")
  })

  it("uses provided footer data", () => {
    const wrapper = mount(TheFooter, {
      global: {
        provide: {
          footer: {
            siteName: "BARTOC",
            api: "",
            query: {},
          },
        },
      },
    })

    expect(wrapper.text()).toContain("BARTOC vocabulary metadata")
  })
})
