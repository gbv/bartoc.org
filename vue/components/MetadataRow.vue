<template>
  <tr
    v-if="show"
    :class="{ 'metadata-row--inherited': inherited }"
    :aria-describedby="inherited ? fieldInheritance.descriptionId : undefined">
    <td class="metadata-row-label">
      <i
        v-if="icon"
        :class="`fas fa-${icon}`" />
      {{ label }}
    </td>
    <td>
      <slot />
    </td>
  </tr>
</template>

<script setup>
import { computed, inject } from "vue"

defineOptions({ name: "MetadataRow" })

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: "",
  },
  show: {
    type: Boolean,
    default: true,
  },
  sourceField: {
    type: [String, Array],
    default: "",
  },
})

// Without inheritance context from a parent, the shared row renders normally.
const fieldInheritance = inject("field-inheritance", {
  isInherited: () => false,
  descriptionId: "",
})

// The row declares its source; server provenance decides whether it is inherited.
const inherited = computed(() => {
  // Aggregated rows such as Titles can represent more than one JSKOS field.
  const fields = Array.isArray(props.sourceField) ? props.sourceField : [props.sourceField]
  return fields.some(fieldInheritance.isInherited)
})
</script>

<style scoped>
.metadata-row-label {
  white-space: nowrap;
}

.metadata-row--inherited > .metadata-row-label {
  border-inline-start: 0.2rem dotted var(--cc-color-muted);
}
</style>
