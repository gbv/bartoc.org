// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import LabelEditor from "../../vue/components/LabelEditor.vue"

const LanguageSelectStub = {
  props: ["modelValue", "guessFrom"],
  emits: ["update:modelValue"],
  template: `
    <select
      data-testid="language"
      :value="modelValue"
      :data-guess-from="guessFrom"
      @change="$emit('update:modelValue', $event.target.value)">
      <option value=""></option>
      <option value="en">en</option>
      <option value="de">de</option>
      <option value="it">it</option>
    </select>
  `,
}

function mountLabelEditor(props) {
  return mount(LabelEditor, {
    props,
    global: {
      stubs: {
        LanguageSelect: LanguageSelectStub,
      },
    },
  })
}

function inputValues(wrapper) {
  return wrapper.findAll("input").map(input => input.element.value)
}

describe("LabelEditor", () => {
  it("loads preferred and alternate labels plus one empty row", () => {
    const wrapper = mountLabelEditor({
      prefLabel: { en: "Title" },
      altLabel: { en: ["Alias"], de: ["Alternativ"] },
    })

    expect(inputValues(wrapper)).toEqual([
      "Title",
      "Alias",
      "Alternativ",
      "",
    ])
    expect(wrapper.findAll("[data-testid='language']").map(select => select.element.value)).toEqual([
      "en",
      "en",
      "de",
      "",
    ])
  })

  it("emits the first label per language as preferred and further labels as alternate", async () => {
    const wrapper = mountLabelEditor({
      prefLabel: { en: "Title" },
      altLabel: {},
    })

    await wrapper.findAll("[data-testid='language']")[1].setValue("en")
    await wrapper.findAll("input")[1].setValue("Alias")
    await nextTick()

    expect(wrapper.findAll("input").at(-1).element.value).toBe("")
    expect(wrapper.emitted("update:prefLabel").at(-1)[0]).toEqual({ en: "Title" })
    expect(wrapper.emitted("update:altLabel").at(-1)[0]).toEqual({ en: ["Alias"] })
  })
})
