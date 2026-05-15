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

<script setup>
import ItemSelect from "./ItemSelect.vue"
import jskos from "jskos-tools"
import { guessLanguage } from "../utils"
import { computed } from "vue"

defineOptions({ inheritAttrs: false })

const props = defineProps({
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
    default: "language…",
  },
  guessFrom: {
    type: String,
    default: undefined,
  },
})

const emit = defineEmits(["update:modelValue"])

const scheme = {
  uri: "http://bartoc.org/en/node/20287",
  API: [{ url: "/api/", type: "http://bartoc.org/api-type/jskos" }],
}

const value = computed({
  get() {
    if (props.repeatable) {
      // always return array
      if (Array.isArray(props.modelValue)) {
        return props.modelValue
      }
      return props.modelValue ? [props.modelValue] : []
    }
    // always return string
    return typeof props.modelValue === "string" ? props.modelValue : ""
  },
  set(val) {
    if (props.repeatable) {
      // always emit array
      const arr = Array.isArray(val) ? val : (val ? [val] : [])
      emit("update:modelValue", arr)
    } else {
      // always emit string
      emit("update:modelValue", typeof val === "string" ? val : "")
    }
  },
})

const canGuess = computed(() => {
  return (props.guessFrom || "").trim().length >= 20
})

function extractValue(concept) {
  return jskos.notation(concept)
}

function extractLabel(concept) {
  return jskos.prefLabel(concept)
}

function guess() {
  if (!canGuess.value || props.repeatable) {
    return
  }
  emit("update:modelValue", guessLanguage(props.guessFrom))
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
