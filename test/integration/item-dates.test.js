// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import ItemDates from "../../vue/components/ItemDates.vue"

describe("ItemDates", () => {
  it("renders distinct dates as a separated semantic list", () => {
    const wrapper = mount(ItemDates, {
      props: {
        item: {
          created: "2022-01-01",
          issued: "2023-01-01",
          modified: "2024-01-01",
        },
      },
    })

    expect(wrapper.get("ul").classes()).toEqual(expect.arrayContaining([
      "item-dates",
      "separated-list",
    ]))
    expect(wrapper.findAll("li").map(item => item.text())).toEqual([
      "created 2022-01-01",
      "issued 2023-01-01",
      "modified 2024-01-01",
    ])
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
