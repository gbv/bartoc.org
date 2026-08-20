<!--
Show inherited definitions as read-only text or edit a local definition.
The local value is always sent to ItemEditor through v-model.
-->
<template>
  <InheritedFieldControl
    :mode="mode"
    :source="definitionSource"
    @start-override="startOverride"
    @use-main="useMain">
    <template #inherited>
      <div data-testid="inherited-definition">
        <LocalizedAbstract :abstract="definitionSource.definition" />
      </div>
    </template>
    <template #editor>
      <AbstractsEditor
        v-model="definition"
        :require-english="requireEnglish" />
    </template>
  </InheritedFieldControl>
</template>

<script setup>
import { computed, ref, toRaw } from "vue"
import { hasMeaningfulValue } from "../utils/itemEditor.js"
import AbstractsEditor from "./AbstractsEditor.vue"
import InheritedFieldControl from "./InheritedFieldControl.vue"
import LocalizedAbstract from "./LocalizedAbstract.vue"

defineOptions({ name: "InheritableAbstractsEditor" })

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  source: {
    type: Object,
    default: null,
  },
  requireEnglish: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["update:modelValue"])

// Keep the editor open while a user clears and rewrites an override.
const overrideActive = ref(hasMeaningfulValue(props.modelValue))

const definitionSource = computed(() =>
  props.source?.uri && hasMeaningfulValue(props.source.definition)
    ? props.source
    : null,
)

const mode = computed(() => {
  if (!definitionSource.value) {
    return "editable"
  }

  return overrideActive.value || hasMeaningfulValue(props.modelValue)
    ? "override"
    : "inherited"
})

const definition = computed({
  get: () => props.modelValue,
  set: (value) => {
    overrideActive.value = true
    emit("update:modelValue", value)
  },
})

function startOverride() {
  if (!definitionSource.value) {
    return
  }

  // Whole-field fallback copies every language into the new local override.
  overrideActive.value = true
  emit(
    "update:modelValue",
    structuredClone(toRaw(definitionSource.value.definition)),
  )
}

function useMain() {
  if (!definitionSource.value) {
    return
  }

  // cleanupItem removes this empty object from the stored record.
  overrideActive.value = false
  emit("update:modelValue", {})
}

function validationError() {
  if (mode.value === "override" && !hasMeaningfulValue(props.modelValue)) {
    return {
      message: "Enter an abstract or use the value from the main record.",
    }
  }
}

defineExpose({ validationError })
</script>
