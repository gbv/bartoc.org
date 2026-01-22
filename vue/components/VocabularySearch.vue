<template>
  <div class="vocabulary-search">
    <form @submit.prevent="submitSearch">
      <form-row>
        <div class="row">
          <div class="col col-md-5">
            <input
              v-model="search"
              type="text"
              placeholder="Title, Publisher..."
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
</style>
