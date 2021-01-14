/**
 * Utility mixin for components that allow to edit a set.
 */
export default {
  emits: ["update:modelValue"],
  props: {
    modelValue: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      set: [...this.modelValue],
    }
  },
  watch: {
    set: {
      deep: true,
      handler(set) {
        this.$emit("update:modelValue", set)
      },
    },
  },
  methods: {
    add(item) {
      this.set.push(item)
    },
    remove(index) {
      this.set.splice(index, 1)
    },
  },
}
