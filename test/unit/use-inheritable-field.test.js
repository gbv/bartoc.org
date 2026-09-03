import { describe, expect, it, vi } from "vitest"
import { reactive } from "vue"
import { useInheritableField } from "../../vue/composables/useInheritableField.js"

describe("useInheritableField", () => {
  it("switches between local, inherited, and editable values", () => {
    const mainValue = [{ uri: "https://example.org/main-value" }]
    const validationMessage = "Enter a value or use the main record."
    const props = reactive({
      modelValue: [{ uri: "https://example.org/local-value" }],
      source: {
        uri: "http://bartoc.org/en/node/1",
        values: mainValue,
      },
    })
    const emit = vi.fn((_event, value) => {
      props.modelValue = value
    })
    const field = useInheritableField(props, emit, {
      field: "values",
      createEmptyValue: () => [],
      validationMessage,
    })

    expect(field.fieldMode.value).toBe("override")

    field.useMain()
    expect(props.modelValue).toEqual([])
    expect(field.fieldMode.value).toBe("inherited")

    const copiedValue = field.startOverride()
    expect(copiedValue).toEqual(mainValue)
    expect(copiedValue[0]).not.toBe(mainValue[0])
    expect(field.fieldMode.value).toBe("override")

    field.updateLocalValue([])
    expect(field.validationError()).toEqual({ message: validationMessage })

    field.useMain()
    expect(emit).toHaveBeenLastCalledWith("update:modelValue", [])

    props.source.values = []
    expect(field.fieldMode.value).toBe("editable")
  })
})
