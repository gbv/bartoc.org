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
        v-model="languages"
        class="cc-form-control"
        :repeatable="true" />
    </template>
  </InheritedFieldControl>
</template>

<script setup>
import { useInheritableField } from "../composables/useInheritableField.js"
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

const {
  sourceRecord: languageSourceRecord,
  fieldMode: languageFieldMode,
  localValue: languages,
  startOverride: startLocalOverride,
  useMain: useLanguagesFromMainRecord,
  validationError,
} = useInheritableField(props, emit, {
  field: "languages",
  createEmptyValue: () => [],
  validationMessage: "Select a language or use the value from the main record.",
})

defineExpose({ validationError })
</script>
