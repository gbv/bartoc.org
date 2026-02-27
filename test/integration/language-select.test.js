// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import LanguageSelect from "../../vue/components/LanguageSelect.vue"

const ItemSelectStub = {
  props: ["modelValue", "repeatable"],
  emits: ["update:modelValue"],
  template: `
    <div>
      <pre data-testid="val">{{ JSON.stringify(modelValue) }}</pre>

      <button data-testid="emit-string" @click="$emit('update:modelValue', 'de')">
        emit string
      </button>

      <button data-testid="emit-array" @click="$emit('update:modelValue', ['de','en'])">
        emit array
      </button>

      <button data-testid="emit-empty" @click="$emit('update:modelValue', repeatable ? [] : '')">
        emit empty
      </button>
    </div>
  `,
}

function mountLang(props) {
  return mount(LanguageSelect, {
    props,
    global: {
      stubs: { ItemSelect: ItemSelectStub },
    },
  })
}

describe("LanguageSelect", () => {
  it("non-repeatable: passes a string (or '') to ItemSelect", () => {
    const w = mountLang({ modelValue: null, repeatable: false })
    expect(w.get("[data-testid=\"val\"]").text()).toBe("\"\"")
  })

  it("non-repeatable: emits a string and ignores arrays", async () => {
    const w = mountLang({ modelValue: "en", repeatable: false })

    await w.get("[data-testid=\"emit-string\"]").trigger("click")
    expect(w.emitted("update:modelValue")[0][0]).toBe("de")

    await w.get("[data-testid=\"emit-array\"]").trigger("click")
    expect(w.emitted("update:modelValue")[1][0]).toBe("")
  })

  it("repeatable: passes an array to ItemSelect (string becomes [string])", () => {
    const w1 = mountLang({ modelValue: "de", repeatable: true })
    expect(w1.get("[data-testid=\"val\"]").text()).toBe("[\"de\"]")

    const w2 = mountLang({ modelValue: null, repeatable: true })
    expect(w2.get("[data-testid=\"val\"]").text()).toBe("[]")

    const w3 = mountLang({ modelValue: ["de", "en"], repeatable: true })
    expect(w3.get("[data-testid=\"val\"]").text()).toBe("[\"de\",\"en\"]")
  })

  it("repeatable: emits arrays and wraps strings into arrays", async () => {
    const w = mountLang({ modelValue: [], repeatable: true })

    await w.get("[data-testid=\"emit-string\"]").trigger("click")
    expect(w.emitted("update:modelValue")[0][0]).toEqual(["de"])

    await w.get("[data-testid=\"emit-array\"]").trigger("click")
    expect(w.emitted("update:modelValue")[1][0]).toEqual(["de", "en"])
  })
})
