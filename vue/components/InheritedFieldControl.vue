<!--
Show one editor field in one of three ways:

- inherited: show the value from the main record as read-only.
- override: show a local editor and a button to use the main value again.
- editable: show a normal editor when there is no value to inherit.

This component only changes what is shown and sends button events.
The parent component must copy or remove the actual field value.

Example:
<InheritedFieldControl
  :mode="fieldMode"
  :source="versionMain"
  @start-override="startOverride"
  @use-main="useMain">
  <template #inherited>{{ versionMain.notation[0] }}</template>
  <template #editor><input v-model="item.notation[0]"></template>
</InheritedFieldControl>
-->
<template>
  <div
    class="inherited-field-control"
    :data-mode="mode">
    <template v-if="mode === 'inherited'">
      <div class="inherited-field-preview">
        <slot name="inherited" />
      </div>
      <InheritedFieldNotice :source="source" />
      <div
        v-if="source?.uri"
        class="inherited-field-actions">
        <span>This value is not stored on this version.</span>
        <button
          type="button"
          class="cc-button cc-button-secondary"
          data-testid="start-override"
          @click="$emit('startOverride')">
          Override for this version
        </button>
      </div>
    </template>

    <template v-else>
      <slot name="editor" />
      <div
        v-if="mode === 'override'"
        class="inherited-field-actions">
        <span>This version has its own value.</span>
        <button
          v-if="source?.uri"
          type="button"
          class="cc-button cc-button-secondary"
          data-testid="use-main"
          @click="$emit('useMain')">
          Use value from main record
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import InheritedFieldNotice from "./InheritedFieldNotice.vue"

defineOptions({ name: "InheritedFieldControl" })

defineProps({
  mode: {
    type: String,
    default: "editable",
    validator: value => ["editable", "inherited", "override"].includes(value),
  },
  source: {
    type: Object,
    default: null,
  },
})

defineEmits(["startOverride", "useMain"])
</script>

<style scoped>
.inherited-field-control {
  display: flex;
  flex-direction: column;
  gap: var(--cc-space-xs);
}

.inherited-field-preview {
  padding: var(--cc-space-sm);
  border-inline-start: 0.25rem solid var(--cc-color-primary);
  background: var(--cc-color-surface-muted);
}

.inherited-field-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cc-space-sm);
  color: var(--cc-color-muted);
  font-size: var(--cc-font-size-sm);
}
</style>
