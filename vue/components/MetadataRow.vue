<template>
  <tr v-if="show">
    <td>
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
defineOptions({ name: "MetadataRow" })

defineProps({
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
})
</script>
