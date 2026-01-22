<template>
  <div class="vocabulary-search">
    <form @submit.prevent="submitSearch">
      <form-row>
        <div class="row">
          <div class="col col-md-7">
            <input
              v-model="search"
              type="text"
              class="form-control">
          </div>
          <form-row>
            <div class="form-inline">
              <select
                v-model="fields"
                class="form-control">
                <option
                  v-for="field in searchFields"
                  :key="field.label"
                  :value="field.value">
                  {{ field.label }}
                </option>
              </select>
            </div>
          </form-row>
          <div class="col col-md-3">
            <button
              type="submit"
              class="btn btn-primary"
              @click="submitSearch">
              search
            </button>
          </div>
        </div>
      </form-row>
      <form-row v-if="hasSchemesCount">
        <div class="text">
          Search in metadata about
          <span>{{ schemesCount }}</span>
          terminologies
        </div>
      </form-row>
    </form>
  </div>
</template>

<script>
import FormRow from "./FormRow.vue"

// search form
export default {
  components: { FormRow },
  props: {
    query: {
      type: Object,
      default: () => ({}),
    },
    schemesCount: { type: Number, default: null },
  },
  data() {
    const searchFields = [
      {
        label: "All Fields",
        value: "allfields",
      },
      {
        label: "Title",
        value: "title_search",
      },
      {
        label: "Publisher",
        value: "publisher_en",
      },
    ]
    const { search, field = "allfields" } = this.query

    return {
      search,
      searchFields,
      fields: field,
    }
  },
  computed: {
    hasSchemesCount() {
      return this.schemesCount !== 0 && this.schemesCount !== null
    },
  },
  methods: {
    submit(query) {
      Object.keys(query)
        .filter((key) => !query[key])
        .forEach((key) => delete query[key])
      window.location.href =
        "/vocabularies?" + new URLSearchParams(query).toString()
    },
    submitSearch() {
      this.submit({ search: this.search, field: this.fields })
    },
  },
}
</script>

<style>
.vocabulary-search {
  padding: 1em 0em;
}
.text {
  color: #666;
  font-weight: 700;
}
.form-group:first-child {
  margin-bottom: 0;
}
</style>
