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
      if (index < this.set.length) {
        this.set.splice(index, 1)
      }
    },
    up(index) {
      if (index && index < this.set.length) {
        [this.set[index], this.set[index-1]] = [this.set[index-1], this.set[index]]
      }
    },
    down(index) {
      if (index < this.set.length + 1) {
        [this.set[index], this.set[index+1]] = [this.set[index+1], this.set[index]]
      }
    },
  },
}
