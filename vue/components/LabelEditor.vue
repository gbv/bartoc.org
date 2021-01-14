<template>
  <table class="table table-sm table-borderless">
    <tr>
      <th>title</th><th colspan="2">
        language code
      </th>
    </tr>
    <tr
      v-for="(label,i) in labels"
      :key="i">
      <td>
        <input
          v-model="label.label"
          type="text"
          class="form-control">
      </td><td>
        <language-select
          v-model="label.language"
          class="form-control" />
      </td><td>
        <button
          type="button"
          class="btn btn-outline-primary"
          @click="remove(i)">
          x
        </button>
      </td>
    </tr>
    <tr>
      <td>
        <button
          type="button"
          class="btn btn-outline-primary"
          @click="add()">
          +
        </button>
      </td>
      <td colspan="2">
        two-letter code if possible, three letter otherwise.
      </td>
    </tr>
  </table>
</template>

<script>
import LanguageSelect from "./LanguageSelect.vue"

/**
 * Edit prefLabel (first of each language) and altLabel.
 */
export default {
  components: { LanguageSelect },
  props: {
    prefLabel: {
      type: Object,
      required: true,
    },
    altLabel: {
      type: Object,
      required: true,
    },
  },
  emits: ["update:prefLabel","update:altLabel"],
  data() {
    return {
      labels: [],
    }
  },
  created() {
    for (const language in this.prefLabel) {
      this.add({ label: this.prefLabel[language], language })
    }
    // this will move an altLabel to become a prefLabel when no prefLabel of its language exist!
    for (const language in this.altLabel) {
      this.altLabel[language].forEach(label => this.add({ label, language }))
    }
    this.add()
    this.$watch("labels", l => this.change(l), { deep: true })
  },
  methods: {
    add(label = { label: "", language: "" }) {
      this.labels.push(label)
    },
    remove(i) {
      this.labels.splice(i, 1)
    },
    change(labels) {
      const prefLabel = {}
      const altLabel = {}
      labels.forEach(({ label, language }) => {
        if (!label) return
        const code = language || "und"
        label = label.trim()
        if (label === "") return
        if (code in altLabel) {
          altLabel[code].push(label)
        } else if (code in prefLabel) {
          altLabel[code] = [label]
        } else {
          prefLabel[code] = label
        }
      })
      this.$emit("update:prefLabel", prefLabel)
      this.$emit("update:altLabel", altLabel)
    },
  },
}
</script>
