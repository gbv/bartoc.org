<template>
  <table class="cc-table cc-table--compact">
    <tbody>
      <tr
        v-for="(label,i) in labels"
        :key="i">
        <td class="label-text-column">
          <input
            v-model="label.label"
            type="text"
            class="form-control">
        </td>
        <td class="label-language-column">
          <language-select
            v-model="label.language"
            class="form-control"
            :guess-from="label.label" />
        </td>
        <td class="label-actions-column">
          <button
            v-if="labels.length > 1"
            type="button"
            title="remove"
            class="cc-button cc-button-secondary cc-button-icon button-remove"
            @click="remove(i)">
            &times;
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { watch, ref } from "vue"
import LanguageSelect from "./LanguageSelect.vue"

const props = defineProps({
  prefLabel: {
    type: Object,
    required: true,
  },
  altLabel: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["update:prefLabel","update:altLabel"])

const labels = ref([])

for (const language in props.prefLabel) {
  add({ label: props.prefLabel[language], language })
}

for (const language in props.altLabel) {
  props.altLabel[language].forEach(label => add({ label, language }))
}
add()

function add(label) {
  labels.value.push(label || { label: "", language: "" })
}
function remove(i) {
  labels.value.splice(i, 1)
}


watch(labels, (value) => {
  const prefLabel = {}
  const altLabel = {}

  if (!value.find(label => label.label.trim() === "")) {
    add() // will trigger handler again
    return
  }

  value.forEach(({ label, language }) => {
    label = label.trim()
    if (label === "") {
      return
    }
    const code = language || "und"
    if (code in altLabel) {
      altLabel[code].push(label)
    } else if (code in prefLabel) {
      altLabel[code] = [label]
    } else {
      prefLabel[code] = label
    }
  })
  emit("update:prefLabel", prefLabel)
  emit("update:altLabel", altLabel)

}, { deep: true })

</script>

<style scoped>
.label-text-column {
  width: 66.667%;
}

.label-language-column {
  width: 25%;
}

.label-actions-column {
  width: 8.333%;
}
</style>
