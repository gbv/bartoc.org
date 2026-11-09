<template>
  <section class="item-quality">
    <p
      v-if="status === 'loading'"
      class="item-quality__feedback"
      role="status">
      Loading daily quality report…
    </p>

    <p
      v-if="status === 'failed'"
      class="item-quality__feedback"
      role="status">
      Daily report unavailable. Showing current checks only.
    </p>

    <ul
      v-if="sortedFindings.length"
      class="item-quality__list">
      <li
        v-for="finding in sortedFindings"
        :key="finding.code"
        class="item-quality__finding"
        :class="`item-quality__finding--${finding.status}`">
        <div class="item-quality__header">
          <h2 class="item-quality__title">
            {{ findingTitle(finding) }}
          </h2>
          <span
            class="item-quality__indicator"
            :class="`item-quality__indicator--${indicatorKind(finding)}`">
            <i
              class="fas"
              :class="indicatorIcon(finding)"
              aria-hidden="true" />
            {{ indicatorLabel(finding) }}
          </span>
        </div>

        <p
          v-if="descriptionAddsInformation(finding)"
          class="item-quality__description">
          {{ finding.description }}
        </p>

        <p
          v-if="finding.messages?.length === 1"
          class="item-quality__message">
          {{ finding.messages[0] }}
        </p>

        <ul
          v-if="finding.messages?.length > 1"
          class="item-quality__messages">
          <li
            v-for="message in finding.messages"
            :key="message">
            {{ message }}
          </li>
        </ul>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"
import { getLiveItemFindings, mergeItemFindings } from "../../src/itemQuality.js"

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})
const emit = defineEmits(["count"])

const findings = ref([])
const status = ref("idle")

// Keep current validation failures first, followed by current quality
// warnings and finally findings that only remain in the daily snapshot.
const sortedFindings = computed(() => [...findings.value].sort((left, right) => {
  const priority = finding => {
    if (finding.status === "fixed") {
      return 2
    }
    return finding.level === "error" ? 0 : 1
  }
  return priority(left) - priority(right)
}))

// Keep the parent informed because it shows the Quality tab only when this
// component has something useful to display.
function setFindings(value) {
  findings.value = value
  emit("count", {
    current: value.filter(finding => finding.status === "issue").length,
    total: value.length,
  })
}

// Validation errors are one finding. Add the number to its title only when
// several validation messages must be shown below it.
function findingTitle(finding) {
  const messageCount = finding.messages?.length || 0
  if (finding.code === "validation-errors" && messageCount > 1) {
    return `${finding.title} (${messageCount})`
  }
  return finding.title
}

// Historical state takes visual precedence over severity. A resolved error
// or warning therefore uses the secondary "fixed" presentation.
function indicatorKind(finding) {
  if (finding.status === "fixed") {
    return "fixed"
  }
  return finding.level || "unknown"
}

// Current findings use an icon based on their severity. Historical findings
// use a check mark because their live check no longer fails.
function indicatorIcon(finding) {
  if (finding.status === "fixed") {
    return "fa-check"
  }
  if (finding.level === "error") {
    return "fa-exclamation-circle"
  }
  if (finding.level === "warning") {
    return "fa-exclamation-triangle"
  }
  return "fa-info-circle"
}

// Keep the visible indicator concise: severity for current findings and
// current/historical state only for findings from an older snapshot.
function indicatorLabel(finding) {
  if (finding.status === "fixed") {
    return "No longer detected"
  }
  if (finding.level === "error") {
    return "Error"
  }
  if (finding.level === "warning") {
    return "Warning"
  }
  return "Finding"
}

// These descriptions add scope that is not already clear from the title.
// Rule definitions remain unchanged; this only controls their presentation.
const usefulDescriptionCodes = new Set([
  "no-abstract",
  "no-subject",
  "no-kos-type",
  "no-languages",
])

function descriptionAddsInformation(finding) {
  // Validation messages already explain their finding. Other descriptions
  // are shown only when their code is explicitly listed above.
  return Boolean(
    finding.description
    && !finding.messages?.length
    && usefulDescriptionCodes.has(finding.code),
  )
}

// Live findings are available immediately. The daily snapshot is loaded in
// the browser and adds fixed findings or confirms current issues.
async function loadQuality() {
  const liveFindings = getLiveItemFindings(props.item)
  setFindings(liveFindings)
  status.value = "loading"

  try {
    const query = new URLSearchParams({ position: `id:${props.item.uri}` })
    const response = await fetch(`/quality/errors?${query}`)
    const reportedErrors = await response.json()

    if (!response.ok || !Array.isArray(reportedErrors)) {
      throw new Error("Invalid quality report response")
    }

    setFindings(mergeItemFindings(reportedErrors, liveFindings))
    status.value = "ready"
  } catch {
    // The live result remains useful when the asynchronous report is missing.
    status.value = "failed"
  }
}

onMounted(loadQuality)
</script>

<style scoped>
.item-quality__list {
  margin: 0;
  padding-inline-start: 0;
  list-style: none;
}

.item-quality__feedback {
  margin: 0 0 var(--cc-space-sm);
  color: var(--cc-color-muted);
  font-size: var(--cc-font-size-sm);
}

.item-quality__finding {
  padding-block: var(--cc-space-md);
  border-bottom: var(--cc-border-width) solid var(--cc-border-color);
}

.item-quality__finding:first-child {
  padding-block-start: var(--cc-space-sm);
}

.item-quality__finding--fixed .item-quality__title,
.item-quality__finding--fixed .item-quality__description,
.item-quality__finding--fixed .item-quality__message,
.item-quality__finding--fixed .item-quality__messages {
  color: var(--cc-color-muted);
}

.item-quality__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: flex-start;
  gap: var(--cc-space-sm);
}

.item-quality__title {
  margin: 0;
  font-size: var(--cc-font-size-lg);
  font-weight: var(--cc-font-weight-regular);
}

.item-quality__indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--cc-space-xs);
  white-space: nowrap;
  font-size: var(--cc-font-size-sm);
  font-weight: var(--cc-font-weight-bold);
}

.item-quality__indicator--error {
  color: var(--cc-color-danger);
}

.item-quality__indicator--warning {
  color: var(--cc-color-warning);
}

.item-quality__indicator--unknown,
.item-quality__indicator--fixed {
  color: var(--cc-color-muted);
}

.item-quality__description {
  margin: var(--cc-space-xs) 0;
  color: var(--cc-color-muted);
}

.item-quality__message,
.item-quality__messages {
  margin: var(--cc-space-sm) 0 0;
  overflow-wrap: anywhere;
}

.item-quality__message {
  max-width: 100%;
}
</style>
