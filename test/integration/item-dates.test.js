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
})
