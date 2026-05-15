// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import EndpointsEditor from "../../vue/components/EndpointsEditor.vue"

const ItemSelectStub = {
  props: ["modelValue", "scheme", "depth", "extractLabel"],
  emits: ["update:modelValue"],
  template: `
    <div data-testid="item-select">
      <span data-testid="api-type">{{ modelValue }}</span>
      <button
        data-testid="set-jskos"
        @click="$emit('update:modelValue', 'http://bartoc.org/api-type/jskos')">
        set JSKOS
      </button>
    </div>
  `,
}

function mountEditor(modelValue = []) {
  return mount(EndpointsEditor, {
    props: {
      modelValue,
    },
    global: {
      stubs: {
        ItemSelect: ItemSelectStub,
      },
    },
  })
}

function inputValues(wrapper) {
  return wrapper.findAll("input").map(input => input.element.value)
}

describe("EndpointsEditor", () => {
  it("renders existing endpoints and appends one empty endpoint row", () => {
    const wrapper = mountEditor([
      {
        url: "https://example.org/api/",
        type: "http://bartoc.org/api-type/webservice",
      },
    ])

    expect(inputValues(wrapper)).toEqual([
      "https://example.org/api/",
      "",
    ])
    expect(wrapper.findAll("[data-testid='api-type']").map(type => type.text())).toEqual([
      "http://bartoc.org/api-type/webservice",
      "http://bartoc.org/api-type/webservice",
    ])

    expect(wrapper.emitted("update:modelValue").at(-1)[0]).toEqual([
      {
        url: "https://example.org/api/",
        type: "http://bartoc.org/api-type/webservice",
      },
      {
        url: "",
        type: "http://bartoc.org/api-type/webservice",
      },
    ])
  })

  it("adds another empty row after typing into the last row", async () => {
    const wrapper = mountEditor([])

    await wrapper.findAll("input")[0].setValue("https://example.org/sparql")

    expect(inputValues(wrapper)).toEqual([
      "https://example.org/sparql",
      "",
    ])
    expect(wrapper.emitted("update:modelValue").at(-1)[0]).toEqual([
      {
        url: "https://example.org/sparql",
        type: "http://bartoc.org/api-type/webservice",
      },
      {
        url: "",
        type: "http://bartoc.org/api-type/webservice",
      },
    ])
  })

  it("emits changed API types from ItemSelect", async () => {
    const wrapper = mountEditor([
      {
        url: "https://example.org/api/",
        type: "http://bartoc.org/api-type/webservice",
      },
    ])

    await wrapper.findAll("[data-testid='set-jskos']")[0].trigger("click")

    expect(wrapper.emitted("update:modelValue").at(-1)[0][0]).toEqual({
      url: "https://example.org/api/",
      type: "http://bartoc.org/api-type/jskos",
    })
  })

  it("removes an endpoint row", async () => {
    const wrapper = mountEditor([
      {
        url: "https://example.org/first",
        type: "http://bartoc.org/api-type/webservice",
      },
      {
        url: "",
        type: "http://bartoc.org/api-type/webservice",
      },
    ])

    await wrapper.findAll("button.button-remove")[0].trigger("click")

    expect(inputValues(wrapper)).toEqual([""])
    expect(wrapper.emitted("update:modelValue").at(-1)[0]).toEqual([
      {
        url: "",
        type: "http://bartoc.org/api-type/webservice",
      },
    ])
  })
})
