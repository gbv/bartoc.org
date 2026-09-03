<!--
Show the generated version title or edit a complete local title override.
The generated title is copied only when the user starts an override.
-->
<template>
  <InheritedFieldControl
    :mode="mode"
    :source="titleSource"
    @start-override="startOverride"
    @use-main="useMainTitle">
    <template #inherited>
      <ul
        class="item-label-list"
        data-testid="inherited-title">
        <li
          v-for="(label, language) in inheritedPrefLabel"
          :key="language">
          <span
            class="language-tag"
            :lang="language">{{ label }}</span>
        </li>
      </ul>
    </template>
    <template #editor>
      <LabelEditor
        :pref-label="localPrefLabel"
        :alt-label="altLabel"
        @update:pref-label="updateLocalValue"
        @update:alt-label="$emit('update:altLabel', $event)" />
    </template>
  </InheritedFieldControl>
</template>

<script setup>
import { deriveVersionPrefLabel } from "../../src/versioning.js"
import { useInheritableField } from "../composables/useInheritableField.js"
import InheritedFieldControl from "./InheritedFieldControl.vue"
import LabelEditor from "./LabelEditor.vue"

defineOptions({ name: "InheritableTitleEditor" })

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  altLabel: {
    type: Object,
    default: () => ({}),
  },
  source: {
    type: Object,
    default: null,
  },
  version: {
    type: String,
    default: "",
  },
})

const emit = defineEmits(["update:modelValue", "update:altLabel"])

// Build the inherited title without using the local override.
function getInheritedTitle(source) {
  const versionRecord = {
    prefLabel: {},
    version: props.version,
    versionOf: source?.uri ? [{ uri: source.uri }] : [],
  }
  const title = deriveVersionPrefLabel(versionRecord, source)

  return title.derived ? title.prefLabel : {}
}

const {
  sourceRecord: titleSource,
  inheritedValue: inheritedPrefLabel,
  fieldMode: mode,
  localValue: localPrefLabel,
  updateLocalValue,
  startOverride,
  useMain,
  validationError,
} = useInheritableField(props, emit, {
  field: "prefLabel",
  getInheritedValue: getInheritedTitle,
  createEmptyValue: () => ({}),
  validationMessage: "Enter a title or use the value from the main record.",
})

function useMainTitle() {
  useMain()
  emit("update:altLabel", {})
}

defineExpose({ validationError })
</script>

<style scoped>
.item-label-list {
  padding-left: 0;
  margin: 0;
  list-style: none;
}
</style>
