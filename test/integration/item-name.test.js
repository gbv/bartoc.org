// @vitest-environment jsdom
import { beforeEach, describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import ItemName from "../../vue/components/ItemName.vue"
import jskos from "jskos-tools"

vi.mock("jskos-tools", () => ({
  default: {
    prefLabel: vi.fn(() => "Mocked label"),
  },
}))

function mountItemName(props = {}) {
  return mount(ItemName, {
    props,
  })
}

describe("ItemName", () => {
  beforeEach(() => {
    vi.mocked(jskos.prefLabel).mockClear()
  })

  it("renders the preferred label returned by jskos-tools", () => {
    const item = {
      uri: "https://example.org/item",
      prefLabel: { en: "Original label" },
    }

    const wrapper = mountItemName({ item, language: "de" })

    expect(wrapper.text()).toBe("Mocked label")
    expect(jskos.prefLabel).toHaveBeenCalledWith(item, {
      fallbackToUri: false,
      language: "de",
    })
  })
})
