<template>
  <InheritedFieldControl
    :mode="mode"
    :source="notationSource"
    @start-override="startOverride"
    @use-main="useMain">
    <template #inherited>
      <span data-testid="inherited-notation">
        {{ notationSource.notation.join(", ") }}
      </span>
    </template>
    <template #editor>
      <input
        v-model="abbreviation"
        type="text"
        class="cc-form-control"
        data-testid="notation-editor">
    </template>
  </InheritedFieldControl>
</template>

<script setup>
import { computed, ref, toRaw } from "vue"
import { hasMeaningfulValue } from "../utils/itemEditor.js"
import InheritedFieldControl from "./InheritedFieldControl.vue"

defineOptions({ name: "AbbreviationEditor" })

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  source: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(["update:modelValue"])

const overrideActive = ref(hasMeaningfulValue(props.modelValue))

const notationSource = computed(() =>
  props.source?.uri && hasMeaningfulValue(props.source.notation)
    ? props.source
    : null,
)

const mode = computed(() => {
  if (!notationSource.value) {
    return "editable"
  }

  return overrideActive.value || hasMeaningfulValue(props.modelValue)
    ? "override"
    : "inherited"
})

const abbreviation = computed({
  get: () => props.modelValue[0] || "",
  set: (value) => {
    overrideActive.value = true
    const notation = [...props.modelValue]
    notation[0] = value
    emit("update:modelValue", notation)
  },
})

function startOverride() {
  if (!notationSource.value) {
    return
  }

  overrideActive.value = true
  emit(
    "update:modelValue",
    structuredClone(toRaw(notationSource.value.notation)),
  )
}

function useMain() {
  if (!notationSource.value) {
    return
  }

  overrideActive.value = false
  emit("update:modelValue", [])
}

function validationError() {
  if (mode.value === "override" && !hasMeaningfulValue(props.modelValue)) {
    return {
      message: "Enter an abbreviation or use the value from the main record.",
    }
  }
}

defineExpose({ validationError })
</script>
