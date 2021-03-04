<template>
  <table class="table table-sm table-borderless">
    <tr
      v-for="(label,i) in labels"
      :key="i"
      class="d-flex">
      <td class="col-8">
        <input
          v-model="label.label"
          type="text"
          class="form-control">
      </td><td class="col-3">
        <language-select
          v-model="label.language"
          class="form-control" />
      </td><td class="col-1">
        <button
          v-if="labels.length > 1"
          type="button"
          title="remove"
          class="btn btn-outline-secondary button-remove"
          @click="remove(i)">
          🗙
        </button>
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
  watch: {
    labels: {
      deep: true,
      handler(labels) {
        const prefLabel = {}
        const altLabel = {}

        if (!labels.find(label => label.label.trim() === "")) {
          this.add() // will trigger handler again
          return
        }

        labels.forEach(({ label, language }) => {
          label = label.trim()
          if (label === "") return
          const code = language || "und"
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
  },
  created() {
    for (const language in this.prefLabel) {
      this.add({ label: this.prefLabel[language], language })
    }
    // this will move an altLabel to become a prefLabel if no prefLabel of its language exist!
    for (const language in this.altLabel) {
      this.altLabel[language].forEach(label => this.add({ label, language }))
    }
    this.add()
  },
  methods: {
    add(label) {
      this.labels.push(label || { label: "", language: "" })
    },
    remove(i) {
      this.labels.splice(i, 1)
    },
  },
}
</script>
