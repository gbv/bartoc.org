// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import AbstractsEditor from "../../vue/components/AbstractsEditor.vue"

const LanguageSelectStub = {
  props: ["modelValue", "repeatable"],
  emits: ["update:modelValue"],
  template: `
    <div>
      <pre data-testid="lang-val">{{ JSON.stringify(modelValue) }}</pre>

      <button data-testid="emit-de" @click="$emit('update:modelValue', 'de')">
        emit de
      </button>

      <button data-testid="emit-it" @click="$emit('update:modelValue', 'it')">
        emit it
      </button>

      <button data-testid="emit-und" @click="$emit('update:modelValue', 'und')">
        emit und
      </button>
    </div>
  `,
}

function mountAbstracts(props) {
  return mount(AbstractsEditor, {
    props,
    global: {
      stubs: {
        LanguageSelect: LanguageSelectStub,
      },
    },
  })
}

describe("AbstractsEditor", () => {
  it("loads existing abstracts from definition", () => {
    const w = mountAbstracts({
      modelValue: {
        it: ["abstract italiano"],
        de: ["Deutsch abstract"],
      },
    })

    const textareas = w.findAll("textarea")
    expect(textareas.length).toBe(2)
    expect(textareas[0].element.value).toBe("abstract italiano")
    expect(textareas[1].element.value).toBe("Deutsch abstract")
  })

  it("supports multiple abstracts in the same language", () => {
    const w = mountAbstracts({
      modelValue: {
        en: ["First English", "Second English"],
      },
    })

    const textareas = w.findAll("textarea")
    expect(textareas.length).toBe(2)
    expect(textareas[0].element.value).toBe("First English")
    expect(textareas[1].element.value).toBe("Second English")
  })

  it("shows an English abstract hint when required and missing", () => {
    const w = mountAbstracts({
      modelValue: {},
      requireEnglish: true,
    })

    expect(w.text()).toContain(
      "Every terminology should have an English abstract at least.",
    )
  })

  it("shows an empty English abstract row when required and missing", () => {
    const w = mountAbstracts({
      modelValue: {},
      requireEnglish: true,
    })

    const textareas = w.findAll("textarea")
    expect(textareas.length).toBe(1)
    expect(textareas[0].element.value).toBe("")
    expect(w.find("[data-testid='lang-val']").text()).toBe("\"en\"")
    const addButton = w.findAll("button").find(b => b.text() === "add abstract")
    expect(addButton.element.disabled).toBe(true)
  })

  it("shows an empty English row when required English is missing from existing abstracts", () => {
    const w = mountAbstracts({
      modelValue: {
        it: ["Abstract italiano"],
      },
      requireEnglish: true,
    })

    expect(w.text()).toContain(
      "Every terminology should have an English abstract at least.",
    )
    const textareas = w.findAll("textarea")
    expect(textareas.length).toBe(2)
    expect(textareas[0].element.value).toBe("")
    expect(textareas[1].element.value).toBe("Abstract italiano")
    expect(w.find("[data-testid='lang-val']").text()).toBe("\"en\"")

    const addButton = w.findAll("button").find(b => b.text() === "add abstract")
    expect(addButton.element.disabled).toBe(true)
  })

  it("hides the English abstract hint when an English abstract exists", () => {
    const w = mountAbstracts({
      modelValue: {
        en: ["English abstract"],
      },
      requireEnglish: true,
    })

    expect(w.text()).not.toContain(
      "Every terminology should have an English abstract at least.",
    )
  })

  it("adds another abstract row", async () => {
    const w = mountAbstracts({
      modelValue: {
        it: ["Abstract italiano"],
      },
    })

    expect(w.findAll("textarea").length).toBe(1)

    await w.findAll("button").find(b => b.text() === "add abstract").trigger("click")

    expect(w.findAll("textarea").length).toBe(2)
  })

  it("clears the only required abstract row instead of removing it", async () => {
    const w = mountAbstracts({
      modelValue: {
        en: ["English abstract"],
      },
      requireEnglish: true,
    })

    expect(w.findAll("textarea").length).toBe(1)

    await w.findAll("button").find(b => b.text() === "clear abstract").trigger("click")

    const textareas = w.findAll("textarea")
    expect(textareas.length).toBe(1)
    expect(textareas[0].element.value).toBe("")
    expect(w.find("[data-testid='lang-val']").text()).toBe("\"en\"")
    expect(w.emitted("update:modelValue").at(-1)[0]).toEqual({})
  })

  it("removes one abstract row and emits updated definition", async () => {
    const w = mountAbstracts({
      modelValue: {
        en: ["English abstract"],
        de: ["Deutsch Abstract"],
      },
    })

    expect(w.findAll("textarea").length).toBe(2)

    await w.findAll("button").find(b => b.text() === "remove abstract").trigger("click")

    expect(w.findAll("textarea").length).toBe(1)

    const last = w.emitted("update:modelValue").at(-1)[0]
    console.log("Emitted value after removing abstract:", last)
    expect(last).toEqual({
      de: ["Deutsch Abstract"],
    })
  })

  it("keeps an empty English row after removing the required English abstract", async () => {
    const w = mountAbstracts({
      modelValue: {
        en: ["English abstract"],
        de: ["Deutsch Abstract"],
      },
      requireEnglish: true,
    })

    expect(w.findAll("textarea").length).toBe(2)

    await w.findAll("button").find(b => b.text() === "remove abstract").trigger("click")
    await w.vm.$nextTick()

    const textareas = w.findAll("textarea")
    expect(textareas.length).toBe(2)
    expect(textareas[0].element.value).toBe("")
    expect(textareas[1].element.value).toBe("Deutsch Abstract")
    expect(w.find("[data-testid='lang-val']").text()).toBe("\"en\"")
    expect(w.emitted("update:modelValue").at(-1)[0]).toEqual({
      de: ["Deutsch Abstract"],
    })
  })

  it("typing into a non-English row emits updated definition", async () => {
    const w = mountAbstracts({
      modelValue: {
        it: ["Abstract italiano"],
      },
    })

    const ta = w.findAll("textarea")[0]
    await ta.setValue("Abstract italiano aggiornato")

    const last = w.emitted("update:modelValue").at(-1)[0]
    expect(last).toEqual({
      it: ["Abstract italiano aggiornato"],
    })
  })

  it("changing language emits updated definition under the new key", async () => {
    const w = mountAbstracts({
      modelValue: {
        en: ["English abstract"],
        und: ["Text to classify"],
      },
    })

    const buttons = w.findAll("[data-testid='emit-de']")
    expect(buttons.length).toBe(2)

    await buttons[1].trigger("click")

    const last = w.emitted("update:modelValue").at(-1)[0]
    expect(last).toEqual({
      en: ["English abstract"],
      de: ["Text to classify"],
    })
  })

  it("removes empty rows on blur when there is more than one row", async () => {
    const w = mountAbstracts({
      modelValue: {
        en: ["English abstract"],
        de: ["Deutsch"],
      },
    })

    const targetRow = w.findAll(".abstract-row").find((row) => {
      const lang = row.find("[data-testid='lang-val']")
      return lang.exists() && lang.text() === "\"de\""
    })

    expect(targetRow).toBeTruthy()

    const ta = targetRow.find("textarea")
    await ta.setValue("")
    await ta.trigger("blur")

    const last = w.emitted("update:modelValue").at(-1)[0]
    expect(last).toEqual({
      en: ["English abstract"],
    })
  })
})
