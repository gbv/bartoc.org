<template>
  <div class="language-select">
    <item-select
      v-bind="$attrs"
      v-model="value"
      class="item-select"
      :repeatable="repeatable"
      :scheme="scheme"
      :extract-value="extractValue"
      :extract-label="extractLabel"
      :placeholder="placeholder" />

    <button
      v-if="guessFrom !== undefined"
      type="button"
      class="guess-language-btn"
      data-testid="guess-language"
      :title="canGuess ? 'Guess language from text' : 'Text too short to guess language'"
      :aria-label="canGuess ? 'Guess language from text' : 'Text too short to guess language'"
      :disabled="!canGuess"
      @click="guess">
      <font-awesome-icon
        size="2x"
        icon="language" />
    </button>
  </div>
</template>

<script>
import ItemSelect from "./ItemSelect.vue"
import jskos from "jskos-tools"
import { guessLanguage } from "../utils"

/**
 * Select one or a list of languages.
 *
 * Is simply a wrapper around ItemSelect since this is used in different places.
 */
export default {
  components: {
    ItemSelect,
  },
  inheritAttrs: false,
  props: {
    modelValue: {
      type: [String, Array],
      default: null,
    },
    repeatable: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: "Choose a language…",
    },
    guessFrom: {
      type: String,
      default: undefined,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      // TODO: Do not hardcode this.
      scheme: {
        uri: "http://bartoc.org/en/node/20287",
        API: [{ url: "/api/", type: "http://bartoc.org/api-type/jskos" }],
      },
    }
  },
  computed: {
    /**
     * Passthrough model value.
     */
    value: {
      get() {
        if (this.repeatable) {
        // always return array
          if (Array.isArray(this.modelValue)) {
            return this.modelValue
          }
          return this.modelValue ? [this.modelValue] : []
        }
        // always return string
        return typeof this.modelValue === "string" ? this.modelValue : ""
      },
      set(val) {
        if (this.repeatable) {
        // always emit array
          const arr = Array.isArray(val) ? val : (val ? [val] : [])
          this.$emit("update:modelValue", arr)
        } else {
        // always emit string
          this.$emit("update:modelValue", typeof val === "string" ? val : "")
        }
      },
    },
    canGuess() {
      return (this.guessFrom || "").trim().length >= 20
    },
  },
  methods: {
    extractValue(concept) {
      return jskos.notation(concept)
    },
    extractLabel(concept) {
      return jskos.prefLabel(concept)
    },
    guess() {
      if (!this.canGuess || this.repeatable) {
        return
      }
      this.$emit("update:modelValue", guessLanguage(this.guessFrom))
    },
  },
}
</script>

<style scoped>
.language-select {
  display: flex;
  align-items: center;
}
.guess-language-btn {
  background: none;
  border: none;
  padding: 0;
  margin-left: 12px;
  cursor: pointer;
}
.guess-language-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.guess-language-btn:focus {
  outline: none !important;
}
</style>
