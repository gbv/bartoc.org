<template>
  <h1>Statistics</h1>

  <div class="container py-4">
    <div class="row g-4">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="card-title">
              Vocabularies
            </h4>
            <p class="card-text">
              BARTOC contains information about
              <a href="/vocabularies">{{ schemesCount }} vocabularies</a>.
              The data is <a href="/download">freely available for download</a>.
              See <a href="/tracker">recent changes</a> for modifications.
            </p>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="card-title">
              Registries
            </h4>
            <p class="card-text">
              BARTOC is not the only vocabulary registry.
              We have catalogued
              <a href="/registries">terminology registries</a>,
              including
              <a href="/registries?type=http://bartoc.org/full-repository">
                repositories or services
              </a>
              with full access to vocabulary content.
            </p>
          </div>
        </div>
      </div>

      <div class="col-12 section-offset">
        <div class="card">
          <div class="card-body">
            <h4 class="card-title">
              More Statistics
            </h4>
            <p class="card-text mb-0">
              See <a href="/data/reports/growth.csv">growth.csv</a> for monthly growth
              and <a href="/data/reports/stats.json">this JSON file</a> for more detailed statistics.
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="reports.length"
        class="col-12 section-offset">
        <div class="card">
          <div class="card-body">
            <h4 class="card-title">
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
          </div>
        </div>
      </div>
    </div>
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
