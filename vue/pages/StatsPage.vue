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
      v-if="qualityReports.length || summaryReports.length"
      class="stats-panel">
      <h4>
        Daily Data Quality Reports
      </h4>
      <p class="reports-intro">
        Review records that may need attention. Open a CSV file in a spreadsheet,
        or use JSON for data processing.
      </p>
      <div
        v-if="summaryReports.length"
        class="report-summary">
        <div
          v-for="report in summaryReports"
          :key="report.file"
          class="report-summary-item">
          <strong>{{ report.title }}</strong>
          <span>{{ report.description }}</span>
          <a
            :href="'/data/reports/' + report.file"
            :aria-label="report.title + ' (JSON, opens in a new tab)'"
            target="_blank"
            rel="noopener noreferrer">JSON</a>
        </div>
      </div>
      <div class="report-list">
        <article
          v-for="report in qualityReports"
          :key="report.id"
          class="report-item">
          <h5>{{ report.title }}</h5>
          <p>{{ report.description }}</p>
          <div class="report-links">
            <a
              v-for="format in report.formats"
              :key="format"
              :href="'/data/reports/' + report.id + '.' + format"
              :aria-label="report.title + ' (' + format.toUpperCase() + ', opens in a new tab)'"
              target="_blank"
              rel="noopener noreferrer">
              {{ format.toUpperCase() }}
            </a>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { qualityChecks } from "../../src/quality.js"

defineOptions({ name: "StatsPage" })

const props = defineProps({
  schemesCount: {
    type: Number,
    required: true,
  },
  // The server passes file names from data/reports, not the report contents.
  reports: {
    type: Array,
    default: () => [],
  },
  warningCounts: {
    type: Object,
    default: null,
  },
})

// Show only checks with records when counts are available.
// Also show only files the server found. A report may have one or both formats.
const qualityReports = computed(() => qualityChecks
  .filter(report => !props.warningCounts || props.warningCounts[report.id] > 0)
  .map(({ id, title, description }) => ({
    id, title, description,
    formats: ["csv", "json"].filter(format => props.reports.includes(id + "." + format)),
  }))
  .filter(report => report.formats.length))

// The summary reports are JSON only. Hide links to files that do not exist.
const summaryReports = computed(() => [
  { file: "validation-errors.json", title: "Validation errors", description: "Records that fail editor checks." },
  { file: "quality-stats.json", title: "Report counts", description: "Record, error, and warning counts." },
].filter(report => props.reports.includes(report.file)))
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

.stats-panel--summary {
  flex: 1 1 0;
}

.stats-panel > :first-child {
  margin-top: 0;
}

.stats-panel > :last-child {
  margin-bottom: 0;
}

.reports-intro,
.report-item p,
.report-summary-item span {
  color: var(--cc-color-muted);
}

.report-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cc-space-sm) var(--cc-space-lg);
  padding-block: var(--cc-space-md);
  border-block: 1px solid var(--cc-border-color);
}

.report-summary-item {
  display: flex;
  flex: 1 1 20rem;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--cc-space-xs);
}

.report-list {
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--cc-space-lg);
}

.report-item {
  flex: 1 1 45%;
  min-width: 0;
  padding-block: var(--cc-space-md);
  border-bottom: 1px solid var(--cc-border-color);
}

.report-item h5 {
  margin: 0;
}

.report-item p {
  margin: var(--cc-space-xs) 0;
}

.report-links {
  display: flex;
  gap: var(--cc-space-md);
}

.report-links a,
.report-summary a {
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

</style>
