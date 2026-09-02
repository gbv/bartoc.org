<!--
Show languages from the main record or edit a complete local override.
Only the local value is sent to ItemEditor through v-model.
-->
<template>
  <InheritedFieldControl
    :mode="languageFieldMode"
    :source="languageSourceRecord"
    @start-override="startLocalOverride"
    @use-main="useLanguagesFromMainRecord">
    <template #inherited>
      <div data-testid="inherited-languages">
        <LanguageSelect
          :model-value="languageSourceRecord.languages"
          class="cc-form-control"
          :repeatable="true"
          :disabled="true" />
      </div>
    </template>
    <template #editor>
      <LanguageSelect
        :model-value="props.modelValue"
        class="cc-form-control"
        :repeatable="true"
        @update:model-value="updateLanguages" />
    </template>
  </InheritedFieldControl>
</template>

<script setup>
import { computed, ref } from "vue"
import { hasMeaningfulValue } from "../utils/itemEditor.js"
import InheritedFieldControl from "./InheritedFieldControl.vue"
import LanguageSelect from "./LanguageSelect.vue"

defineOptions({ name: "InheritableLanguagesEditor" })

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

// Remember a local override even while the user is changing its values.
const isOverrideActive = ref(hasMeaningfulValue(props.modelValue))

// Use the main record only when it has languages to inherit.
const languageSourceRecord = computed(() =>
  props.source?.uri && hasMeaningfulValue(props.source.languages)
    ? props.source
    : null,
)

// Choose how the Languages field is shown.
//
// Use the normal editor if the main record has no languages. A local value or
// an active override uses override mode; otherwise, the main languages are
// read-only.
const languageFieldMode = computed(() => {
  if (!languageSourceRecord.value) {
    return "editable"
  }

  return isOverrideActive.value || hasMeaningfulValue(props.modelValue)
    ? "override"
    : "inherited"
})

// Send a changed local list back to ItemEditor.
function updateLanguages(value) {
  isOverrideActive.value = true
  emit("update:modelValue", value)
}

// Start an independent language list for this version.
//
// Copy the complete main list and switch to override mode. The new array can
// be edited without changing the main record.
function startLocalOverride() {
  if (!languageSourceRecord.value) {
    return
  }

  isOverrideActive.value = true
  emit(
    "update:modelValue",
    [...languageSourceRecord.value.languages],
  )
}

// Return to the languages supplied by the main record.
//
// Leave override mode and send an empty local list, which is omitted on save.
// This restores inheritance without changing the main record.
function useLanguagesFromMainRecord() {
  if (!languageSourceRecord.value) {
    return
  }

  isOverrideActive.value = false
  emit("update:modelValue", [])
}

// Report an empty local override before saving.
function validationError() {
  if (
    languageFieldMode.value === "override"
    && !hasMeaningfulValue(props.modelValue)
  ) {
    return {
      message: "Select a language or use the value from the main record.",
    }
  }
}

defineExpose({ validationError })
</script>
