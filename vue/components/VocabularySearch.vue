<template>
  <div class="vocabulary-search">
    <form @submit.prevent="submitSearch">
      <form-row v-if="hasSchemesCount">
        <div class="metadata-count-text">
          Search in metadata about
          <span>{{ schemesCount }}</span>
          terminologies
        </div>
      </form-row>
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
                  v-for="searchField in searchFields"
                  :key="searchField.label"
                  :value="searchField.value">
                  {{ searchField.label }}
                </option>
              </select>
            </div>
          </form-row>
          <div class="col">
            <button
              type="submit"
              class="btn btn-primary">
              Search
            </button>
          </div>
        </div>
      </form-row>
    </form>
  </div>
</template>

<script setup>
import { computed, ref } from "vue"
import FormRow from "./FormRow.vue"

const props = defineProps({
  query: {
    type: Object,
    default: () => ({}),
  },
  schemesCount: { type: Number, default: null },
})

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
  {
    label: "Subject notation",
    value: "subject_notation",
  },
  {
    label: "Subject Uri",
    value: "subject_uri",
  },
]

const { search: initialSearch, field: initialField = "allfields" } = props.query
const search = ref(initialSearch)
const fields = ref(initialField)

const hasSchemesCount = computed(() => props.schemesCount !== 0 && props.schemesCount !== null)

function submit(query) {
  Object.keys(query)
    .filter((key) => !query[key])
    .forEach((key) => delete query[key])
  window.location.href =
    "/vocabularies?" + new URLSearchParams(query).toString()
}

function submitSearch() {
  submit({ search: search.value, field: fields.value })
}
</script>

<style>
.form-group:first-child {
  margin-bottom: 0;
}
</style>
