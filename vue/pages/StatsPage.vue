<template>
  <h1>Statistics</h1>

  <div class="stats-layout">
    <section class="stats-panel stats-panel--summary">
      <h4>
        Vocabularies
      </h4>
      <p>
        BARTOC contains information about
        <a href="/vocabularies">{{ schemesCount }} vocabularies</a>.
        The data is <a href="/download">freely available for download</a>.
        See <a href="/tracker">recent changes</a> for modifications.
      </p>
    </section>

    <section class="stats-panel stats-panel--summary">
      <h4>
        Registries
      </h4>
      <p>
        BARTOC is not the only vocabulary registry.
        We have catalogued
        <a href="/registries">terminology registries</a>,
        including
        <a href="/registries?type=http://bartoc.org/full-repository">
          repositories or services
        </a>
        with full access to vocabulary content.
      </p>
    </section>

    <section class="stats-panel">
      <h4>
        More Statistics
      </h4>
      <p>
        See <a href="/data/reports/growth.csv">growth.csv</a> for monthly growth
        and <a href="/data/reports/stats.json">this JSON file</a> for more detailed statistics.
      </p>
    </section>

    <section
      v-if="reports.length"
      class="stats-panel">
      <h4>
        Daily Data Quality Reports
      </h4>
      <div class="action-group">
        <a
          v-for="file in reports"
          :key="file"
          :href="`/data/reports/${file}`"
          class="cc-button cc-button-primary">
          {{ file }}
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
defineOptions({ name: "StatsPage" })

defineProps({
  schemesCount: {
    type: Number,
    required: true,
  },
  reports: {
    type: Array,
    default: () => [],
  },
})
</script>

<style scoped>
.stats-layout {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cc-space-lg);
  padding-block: var(--cc-space-lg);
}

.stats-panel {
  flex: 0 0 100%;
  padding: var(--cc-space-md);
  border: 1px solid var(--cc-border-color);
  border-radius: var(--cc-radius-sm);
  background: var(--cc-color-surface);
}

.stats-panel > :first-child {
  margin-top: 0;
}

.stats-panel > :last-child {
  margin-bottom: 0;
}

@media (min-width: 48rem) {
  .stats-panel--summary {
    flex: 1 1 0;
  }
}
</style>
