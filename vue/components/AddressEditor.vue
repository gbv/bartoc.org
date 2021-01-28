<template>
  <table class="table-sm">
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
  </table>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  data() {
    const { ext, street, locality, code, region, country } = (this.modelValue || {})
    return { ext, street, locality, code, region, country }
  },
  created() {
    for (const name of ["ext", "street", "locality", "code", "region", "country"]) {
      this.$watch(name, this.update)
    }
  },
  methods: {
    update() {
      const { ext, street, locality, code, region, country } = this
      this.$emit("update:modelValue", { ext, street, locality, code, region, country })
    },
  },
}
</script>
