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
    <section class="stats-panel">
      <h4>
        Daily Data Quality Reports
      </h4>
      <p class="reports-intro">
        Review records that may need attention. Quality reports are available in
        <a href="https://gbv.github.io/data-validation-report-format/">DVRF</a> (JSON)
        for data processing or in CSV for spreadsheet.
      </p>
      <div class="report-list">
        <article
          v-for="(report, id) in reports"
          :key="id"
          class="report-item">
          <h5 v-if="report.types?.[0]">
            {{ report.title }} (<a :href="searchUrl(report.types[0])">{{ report.totalErrors }} {{ report.level || "error" }}s</a>)
          </h5>
          <h5 v-else-if="id === 'summary'">
            {{ report.title }} ({{ report.totalErrors }} records with findings)
          </h5>
          <h5 v-else>
            {{ report.title }} ({{ report.totalErrors }} {{ report.level || "error" }}s)
          </h5>
          <p>{{ report.description }}</p>
          <div class="report-links">
            <a
              v-for="format in report.formats"
              :key="format"
              :href="`/data/reports/${id}.${format}`"
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
defineOptions({ name: "StatsPage" })

const searchUrl = code => `/vocabularies/?filter=${encodeURIComponent(`error:${code}`)}`

defineProps({
  schemesCount: {
    type: Number,
    required: true,
  },
  reports: {
    type: Object,
    default: () => {},
  },
})
</script>
