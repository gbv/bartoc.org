// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import Icon from "../../vue/components/Icon.vue"

const FontAwesomeIconStub = {
  props: ["icon", "flip"],
  template: `
    <span
      data-testid="font-awesome-icon"
      :data-icon="icon"
      :data-flip="flip || ''">
    </span>
  `,
}

function mountIcon(props) {
  return mount(Icon, {
    props,
    global: {
      stubs: {
        FontAwesomeIcon: FontAwesomeIconStub,
      },
    },
  })
}

describe("Icon", () => {
  it("renders a known icon with default padding", () => {
    const wrapper = mountIcon({ name: "link" })

    const icon = wrapper.get("[data-testid='font-awesome-icon']")
    expect(icon.attributes("data-icon")).toBe("link")
    expect(icon.attributes("data-flip")).toBe("")
    expect(wrapper.get("span").attributes("style")).toBe("padding-right: 0.5em;")
  })

  it("passes flip for directional icons", () => {
    const wrapper = mountIcon({ name: "levelUp" })

    const icon = wrapper.get("[data-testid='font-awesome-icon']")
    expect(icon.attributes("data-icon")).toBe("level-up-alt")
    expect(icon.attributes("data-flip")).toBe("horizontal")
  })

  it("omits padding style when padding is empty", () => {
    const wrapper = mountIcon({ name: "created", padding: "" })

    expect(wrapper.get("[data-testid='font-awesome-icon']").attributes("data-icon")).toBe("calendar")
    expect(wrapper.get("span").attributes("style")).toBeUndefined()
  })

  it("renders the icon name as fallback for unknown icons", () => {
    const wrapper = mountIcon({ name: "unknown-icon" })

    expect(wrapper.find("[data-testid='font-awesome-icon']").exists()).toBe(false)
    expect(wrapper.text()).toBe("unknown-icon")
  })
})
