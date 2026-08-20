// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mount } from "@vue/test-utils"
import SubjectEditor from "../../vue/components/SubjectEditor.vue"
import * as utils from "../../vue/utils.js"


vi.mock("../../vue/utils.js", () => {
  const fakeSchemes = [
    {
      uri: "http://bartoc.org/en/node/241",
      notation: ["DDC"],
    },
    {
      uri: "http://eurovoc.europa.eu/100141",
      notation: ["EUROVOC"],
      prefLabel: { en: "EuroVoc" },
    },
    {
      uri: "http://www.iskoi.org/ilc/2/scheme",
      notation: ["ILC"],
    },
  ]

  return {
    indexingSchemes: fakeSchemes,
    createSubjectProvider: vi.fn((scheme) => ({ scheme })),
  }
})

const ItemNameStub = {
  props: ["item", "notation", "prefLabel"],
  template: `
    <span class="item-name">
      {{ item?.notation?.[0] || item?.prefLabel?.en || item?.uri || "" }}
    </span>
  `,
}

const JskosItemPickerStub = {
  props: ["modelValue", "provider", "showSelected", "placeholder"],
  emits: ["update:modelValue"],
  template: `
    <div data-testid="picker">
      <div data-testid="picker-count">{{ modelValue.length }}</div>
      <div data-testid="picker-show-selected">{{ String(showSelected) }}</div>
      <button
        data-testid="emit-picker-update"
        @click="$emit('update:modelValue', [
          {
            uri: 'http://example.org/new-ddc',
            notation: ['999'],
            prefLabel: { en: 'New DDC concept' },
            inScheme: [{ uri: 'http://bartoc.org/en/node/241' }],
          }
        ])">
        emit update
      </button>
    </div>
  `,
}

function mountEditor(modelValue = []) {
  return mount(SubjectEditor, {
    props: { modelValue },
    global: {
      stubs: {
        ItemName: ItemNameStub,
        JskosItemPicker: JskosItemPickerStub,
      },
    },
  })
}

describe("SubjectEditor", () => {
  beforeEach(() => {
    vi.mocked(utils.createSubjectProvider).mockClear()
  })

  it("renders all selected subjects", () => {
    const wrapper = mountEditor([
      {
        uri: "http://dewey.info/class/20/",
        notation: ["20"],
        prefLabel: { en: "Religion" },
        inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
      },
      {
        uri: "http://eurovoc.europa.eu/1004",
        notation: ["1004"],
        prefLabel: { en: "EU concept" },
        inScheme: [{ uri: "http://eurovoc.europa.eu/100141" }],
      },
    ])

    const rows = wrapper.findAll("tbody tr")
    expect(rows).toHaveLength(2)
    expect(wrapper.text()).toContain("DDC")
    expect(wrapper.text()).toContain("20")
    expect(wrapper.text()).toContain("EUROVOC")
    expect(wrapper.text()).toContain("1004")
  })

  it("renders a read-only subject list without editing controls", () => {
    const wrapper = mount(SubjectEditor, {
      props: {
        modelValue: [{
          uri: "http://dewey.info/class/300/",
          notation: ["300"],
          prefLabel: { en: "Social sciences" },
          inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
        }],
        readOnly: true,
      },
      global: {
        stubs: {
          ItemName: ItemNameStub,
          JskosItemPicker: JskosItemPickerStub,
        },
      },
    })

    expect(wrapper.text()).toContain("300")
    expect(wrapper.find(".subject-picker").exists()).toBe(false)
    expect(wrapper.find(".actions-col").exists()).toBe(false)
  })

  it("passes only subjects of the active scheme to the picker", () => {
    const wrapper = mountEditor([
      {
        uri: "http://dewey.info/class/20/",
        notation: ["20"],
        prefLabel: { en: "Religion" },
        inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
      },
      {
        uri: "http://dewey.info/class/305/",
        notation: ["305"],
        prefLabel: { en: "Social groups" },
        inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
      },
      {
        uri: "http://eurovoc.europa.eu/1004",
        notation: ["1004"],
        prefLabel: { en: "EU concept" },
        inScheme: [{ uri: "http://eurovoc.europa.eu/100141" }],
      },
    ])

    expect(wrapper.get("[data-testid='picker-count']").text()).toBe("2")
    expect(wrapper.get("[data-testid='picker-show-selected']").text()).toBe("false")
    expect(utils.createSubjectProvider).toHaveBeenCalled()
  })

  it("updates picker subjects when the scheme changes", async () => {
    const wrapper = mountEditor([
      {
        uri: "http://dewey.info/class/20/",
        notation: ["20"],
        prefLabel: { en: "Religion" },
        inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
      },
      {
        uri: "http://eurovoc.europa.eu/1004",
        notation: ["1004"],
        prefLabel: { en: "EU concept" },
        inScheme: [{ uri: "http://eurovoc.europa.eu/100141" }],
      },
    ])

    expect(wrapper.get("[data-testid='picker-count']").text()).toBe("1")

    await wrapper.get("select").setValue("http://eurovoc.europa.eu/100141")

    expect(wrapper.get("[data-testid='picker-count']").text()).toBe("1")
    expect(utils.createSubjectProvider).toHaveBeenLastCalledWith(
      expect.objectContaining({ uri: "http://eurovoc.europa.eu/100141" }),
    )
  })

  it("merges picker updates back into the full subject list", async () => {
    const wrapper = mountEditor([
      {
        uri: "http://dewey.info/class/20/",
        notation: ["20"],
        prefLabel: { en: "Religion" },
        inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
      },
      {
        uri: "http://eurovoc.europa.eu/1004",
        notation: ["1004"],
        prefLabel: { en: "EU concept" },
        inScheme: [{ uri: "http://eurovoc.europa.eu/100141" }],
      },
    ])

    await wrapper.get("[data-testid='emit-picker-update']").trigger("click")

    const emitted = wrapper.emitted("update:modelValue")
    expect(emitted).toBeTruthy()

    const lastValue = emitted.at(-1)[0]
    expect(lastValue).toEqual([
      {
        uri: "http://example.org/new-ddc",
        notation: ["999"],
        prefLabel: { en: "New DDC concept" },
        inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
      },
      {
        uri: "http://eurovoc.europa.eu/1004",
        notation: ["1004"],
        prefLabel: { en: "EU concept" },
        inScheme: [{ uri: "http://eurovoc.europa.eu/100141" }],
      },
    ])
  })

  it("removes one selected subject", async () => {
    const wrapper = mountEditor([
      {
        uri: "http://dewey.info/class/20/",
        notation: ["20"],
        prefLabel: { en: "Religion" },
        inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
      },
      {
        uri: "http://eurovoc.europa.eu/1004",
        notation: ["1004"],
        prefLabel: { en: "EU concept" },
        inScheme: [{ uri: "http://eurovoc.europa.eu/100141" }],
      },
    ])

    const removeButtons = wrapper.findAll("button").filter(
      (btn) => btn.text() === "×",
    )

    await removeButtons[0].trigger("click")

    const lastValue = wrapper.emitted("update:modelValue").at(-1)[0]
    expect(lastValue).toEqual([
      {
        uri: "http://eurovoc.europa.eu/1004",
        notation: ["1004"],
        prefLabel: { en: "EU concept" },
        inScheme: [{ uri: "http://eurovoc.europa.eu/100141" }],
      },
    ])
  })

  it("reorders editable subjects without moving a mapped subject", async () => {
    const firstSubject = {
      uri: "http://dewey.info/class/20/",
      notation: ["20"],
      prefLabel: { en: "Religion" },
      inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
    }
    const mappedSubject = {
      uri: "http://example.org/mapped-subject",
      notation: ["200"],
      prefLabel: { en: "Mapped Subject" },
      inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
      MAPPING: [{ uri: "mapping:1" }],
    }
    const lastSubject = {
      uri: "http://dewey.info/class/300/",
      notation: ["300"],
      prefLabel: { en: "Social sciences" },
      inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
    }
    const wrapper = mountEditor([
      firstSubject,
      mappedSubject,
      lastSubject,
    ])

    const moveDownButtons = wrapper.findAll("button").filter(
      button => button.text() === "▼",
    )
    await moveDownButtons[0].trigger("click")

    const lastValue = wrapper.emitted("update:modelValue").at(-1)[0]
    expect(lastValue).toEqual([
      lastSubject,
      mappedSubject,
      firstSubject,
    ])
  })

  it("does not render mapped subjects in the editable list", async () => {
    const wrapper = mountEditor([
      {
        uri: "http://dewey.info/class/20/",
        notation: ["20"],
        prefLabel: { en: "Religion" },
        inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
      },
      {
        uri: "http://example.org/derived-subject",
        notation: ["200"],
        prefLabel: { en: "Mapped Subject" },
        inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
        MAPPING: [{ uri: "mapping:1" }],
      },
    ])

    const rows = wrapper.findAll("tbody tr")
    expect(rows).toHaveLength(1)
    expect(wrapper.get("[data-testid='picker-count']").text()).toBe("1")

    await wrapper.get("[data-testid='emit-picker-update']").trigger("click")

    const lastValue = wrapper.emitted("update:modelValue").at(-1)[0]
    expect(lastValue).toEqual([
      {
        uri: "http://example.org/new-ddc",
        notation: ["999"],
        prefLabel: { en: "New DDC concept" },
        inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
      },
      {
        uri: "http://example.org/derived-subject",
        notation: ["200"],
        prefLabel: { en: "Mapped Subject" },
        inScheme: [{ uri: "http://bartoc.org/en/node/241" }],
        MAPPING: [{ uri: "mapping:1" }],
      },
    ])
  })

})
