// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import ItemDates from "../../vue/components/ItemDates.vue"

describe("ItemDates", () => {
  it("renders distinct dates and formats timestamps", () => {
    const timestamp = "2026-08-21T09:43:55.919Z"
    const formattedTimestamp = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp))
    const wrapper = mount(ItemDates, {
      props: {
        item: {
          created: "2022-01-01",
          issued: "2023-01-01",
          modified: timestamp,
        },
      },
    })

    expect(wrapper.get("ul").classes()).toEqual([
      "item-dates",
      "separated-list",
    ])
    expect(wrapper.findAll("li").map(item => item.text())).toEqual([
      "created 2022-01-01",
      "issued 2023-01-01",
      `modified ${formattedTimestamp}`,
    ])
    expect(wrapper.findAll("time")[2].attributes("datetime")).toBe(timestamp)
  })

  it("does not repeat a modified date already shown as created or issued", () => {
    const wrapper = mount(ItemDates, {
      props: {
        item: {
          created: "2024-01-01",
          modified: "2024-01-01",
        },
      },
    })

    expect(wrapper.findAll("li")).toHaveLength(1)
  })


  it("renders resource format links alongside dates", () => {
    const wrapper = mount(ItemDates, {
      props: {
        item: {
          uri: "http://bartoc.org/en/node/123",
          created: "2022-01-01",
          modified: "2024-01-01",
        },
        resourcePath: "/en/node/123",
      },
    })

    const links = wrapper.findAll("a").map(link => ({
      label: link.text(),
      href: link.attributes("href"),
    }))

    expect(links).toEqual([
      {
        label: "JSKOS",
        href: "/api/data?uri=http%3A%2F%2Fbartoc.org%2Fen%2Fnode%2F123",
      },
      {
        label: "NT",
        href: "/en/node/123?format=nt&inline=1",
      },
      {
        label: "RDF",
        href: "/en/node/123?format=rdfxml",
      },
    ])

    expect(wrapper.findAll("li")).toHaveLength(3)
  })

  it("shows resource format links even when dates are missing", () => {
    const wrapper = mount(ItemDates, {
      props: {
        item: {
          uri: "http://bartoc.org/en/node/123",
        },
        resourcePath: "/en/node/123",
      },
    })

    expect(wrapper.find("ul").exists()).toBe(true)
    expect(wrapper.findAll("time")).toHaveLength(0)
    expect(wrapper.findAll("a").map(link => link.text())).toEqual([
      "JSKOS",
      "NT",
      "RDF",
    ])
  })

  it("does not generate resource links without a URI or resource path", () => {
    const withoutUri = mount(ItemDates, {
      props: {
        item: { created: "2022-01-01" },
        resourcePath: "/en/node/123",
      },
    })

    const withoutPath = mount(ItemDates, {
      props: {
        item: {
          uri: "http://bartoc.org/en/node/123",
          created: "2022-01-01",
        },
      },
    })

    expect(withoutUri.findAll("a")).toHaveLength(0)
    expect(withoutPath.findAll("a")).toHaveLength(0)

    // The dates remain visible.
    expect(withoutUri.findAll("time")).toHaveLength(1)
    expect(withoutPath.findAll("time")).toHaveLength(1)
  })


})
