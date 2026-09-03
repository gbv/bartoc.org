// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import MetadataListRow from "../../vue/components/MetadataListRow.vue"

describe("MetadataListRow", () => {
  it("expands a list preview", async () => {
    const wrapper = mount(MetadataListRow, {
      props: {
        label: "Wikipedia",
        items: ["de", "en", "fr"],
        previewLimit: 2,
      },
    })
    const toggle = wrapper.get("button")

    expect(wrapper.findAll("li")).toHaveLength(2)
    expect(toggle.text()).toBe("show all (3)")

    await toggle.trigger("click")

    expect(wrapper.findAll("li")).toHaveLength(3)
    expect(toggle.text()).toBe("show less")
  })
})
