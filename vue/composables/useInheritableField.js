import { computed, ref, toRaw } from "vue"
import { hasMeaningfulValue } from "../utils/itemEditor.js"

/**
 * Manage a field that can copy a value from the main record.
 *
 * A version saves only its own value. If its value is empty, it uses the value
 * from the main record when one is available.
 *
 * Each component provides the field name, its empty value, and an error
 * message. This composable does not change the props or the main record.
 * It sends each change with the `update:modelValue` event.
 */
export function useInheritableField(props, emit, options) {
  const {
    field,
    createEmptyValue,
    validationMessage,
    getInheritedValue = source => source?.[field],
  } = options

  // Remember that the user chose to edit a local value. Keep the editor open
  // if the user clears that value, so they can enter a new one or use the main
  // value again.
  const overrideActive = ref(hasMeaningfulValue(props.modelValue))

  // Some fields inherit only part of the source record.
  const inheritedValue = computed(() => getInheritedValue(props.source))

  // The field can use the main record only when the main record has a value.
  // Otherwise, show a normal editor.
  const sourceRecord = computed(() =>
    props.source?.uri && hasMeaningfulValue(inheritedValue.value)
      ? props.source
      : null,
  )

  // The field has three modes:
  // - editable: the main record has no value;
  // - inherited: show the main value as read-only;
  // - override: edit and save a local value instead.
  const fieldMode = computed(() => {
    if (!sourceRecord.value) {
      return "editable"
    }

    return overrideActive.value || hasMeaningfulValue(props.modelValue)
      ? "override"
      : "inherited"
  })

  // Any edit starts a local override. This also applies when the new value is
  // empty while the user is changing it.
  function updateLocalValue(value) {
    overrideActive.value = true
    emit("update:modelValue", value)
  }

  // Use this value for editors that work directly with v-model. Editors that
  // convert their input first can call updateLocalValue instead.
  const localValue = computed({
    get: () => props.modelValue,
    set: updateLocalValue,
  })

  // Start with a full copy of the main value. The copy lets the user edit
  // arrays and objects without changing the main record.
  function startOverride() {
    if (!sourceRecord.value) {
      return
    }

    const value = structuredClone(toRaw(inheritedValue.value))
    overrideActive.value = true
    emit("update:modelValue", value)
    return value
  }

  // Stop using the local value and send an empty value. ItemEditor removes the
  // empty field before saving, so the version keeps using the main value.
  function useMain() {
    if (!sourceRecord.value) {
      return
    }

    overrideActive.value = false
    emit("update:modelValue", createEmptyValue())
  }

  // Do not save an empty override. The user must enter a value or choose the
  // main value again.
  function validationError() {
    if (fieldMode.value === "override" && !hasMeaningfulValue(props.modelValue)) {
      return { message: validationMessage }
    }
  }

  return {
    sourceRecord,
    inheritedValue,
    fieldMode,
    localValue,
    updateLocalValue,
    startOverride,
    useMain,
    validationError,
  }
}
