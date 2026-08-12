<template>
  <table class="cc-table cc-table--compact">
    <tbody>
      <tr>
        <td>Street address</td>
        <td>
          <input
            v-model="street"
            type="text"
            class="form-control">
        </td>
      </tr><tr>
        <td />
        <td>
          <input
            v-model="ext"
            type="text"
            class="form-control">
        </td>
      </tr><tr>
        <td>City</td>
        <td>
          <input
            v-model="locality"
            type="text"
            class="form-control">
        </td>
      </tr><tr>
        <td>Region/State</td>
        <td>
          <input
            v-model="region"
            type="text"
            class="form-control">
        </td>
      </tr><tr>
        <td>Postal code</td>
        <td>
          <input
            v-model="code"
            type="text"
            class="form-control">
        </td>
      </tr><tr>
        <td>Country</td>
        <td>
          <input
            v-model="country"
            type="text"
            class="form-control">
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { ref, watch } from "vue"

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(["update:modelValue"])

const ext = ref("")
const street = ref("")
const locality = ref("")
const code = ref("")
const region = ref("")
const country = ref("")

function setFields(value = {}) {
  ext.value = value.ext || ""
  street.value = value.street || ""
  locality.value = value.locality || ""
  code.value = value.code || ""
  region.value = value.region || ""
  country.value = value.country || ""
}

function update() {
  emit("update:modelValue", {
    ext: ext.value,
    street: street.value,
    locality: locality.value,
    code: code.value,
    region: region.value,
    country: country.value,
  })
}

setFields(props.modelValue)

watch(
  () => props.modelValue,
  value => {
    setFields(value)
  },
)

watch(
  [ext, street, locality, code, region, country],
  update,
)
</script>
