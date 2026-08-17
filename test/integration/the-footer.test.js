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
    expect(links.sources).toBe("https://github.com/gbv/bartoc.org")
    expect(links.issues).toBe("https://github.com/gbv/bartoc.org/issues")
  })

  it("shows item resource format links", () => {
    const wrapper = mount(TheFooter, {
      props: {
        itemUri: "http://bartoc.org/en/node/123",
        resourcePath: "/en/node/123",
      },
    })

    const links = linksByLabel(wrapper)

    expect(links.JSON).toBe("/api/data?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123")
    expect(links.RDF).toBe("/en/node/123?format=nt&inline=1")
    expect(links.XML).toBe("/en/node/123?format=rdfxml")
  })

  it("uses provided footer data", () => {
    const wrapper = mount(TheFooter, {
      global: {
        provide: {
          footer: {
            siteName: "BARTOC",
            itemUri: "http://bartoc.org/en/node/123",
            resourcePath: "/en/node/123",
            api: "",
            query: {},
          },
        },
      },
    })

    expect(wrapper.text()).toContain("BARTOC vocabulary metadata")
    const links = linksByLabel(wrapper)
    expect(links.JSON).toBe("/api/data?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123")
    expect(links.RDF).toBe("/en/node/123?format=nt&inline=1")
    expect(links.XML).toBe("/en/node/123?format=rdfxml")
  })

  it("shows API result links", () => {
    const wrapper = mount(TheFooter, {
      props: {
        api: "data",
        query: {
          search: "dfg",
          field: "title_search",
        },
      },
    })

    expect(linksByLabel(wrapper).JSON).toBe("/api/data?search=dfg&field=title_search")
  })
})
