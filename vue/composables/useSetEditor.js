import { ref, watch } from "vue"

/**
 * Shared editing behavior for components that manage an ordered array via v-model.
 */
export function useSetEditor(props, emit, ensureEmpty) {
  const set = ref([...props.modelValue])

  function add(item) {
    set.value.push(item)
  }

  function remove(index) {
    if (index < set.value.length) {
      set.value.splice(index, 1)
    }
  }

  function up(index) {
    if (index && index < set.value.length) {
      [set.value[index], set.value[index - 1]] = [set.value[index - 1], set.value[index]]
    }
  }

  function down(index) {
    if (index < set.value.length - 1) {
      [set.value[index], set.value[index + 1]] = [set.value[index + 1], set.value[index]]
    }
  }

  // Keep one blank entry available for adding a new value.
  ensureEmpty(set)

  watch(set, (value) => {
    // Nested array edits, such as v-model on set[i], should update the parent.
    ensureEmpty(set)
    emit("update:modelValue", value)
  }, { deep: true })

  return { set, add, remove, up, down }
}
