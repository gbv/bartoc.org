<template>
  <div class="vocabulary-search">
    <ul
      class="nav nav-tabs"
      role="tablist">
      <li
        class="nav-item"
        role="presentation">
        <a
          class="nav-link"
          :class="{
            active: tab === 0,
          }"
          href=""
          data-toggle="tab"
          role="tab"
          :aria-selected="tab === 0"
          @click.prevent="tab = 0">Search</a>
      </li>
      <li
        class="nav-item"
        role="presentation">
        <a
          class="nav-link"
          :class="{
            active: tab === 1,
          }"
          href=""
          role="tab"
          :aria-selected="tab === 1"
          @click.prevent="tab = 1">Filter</a>
      </li>
    </ul>
    <div
      class="tab-content p-3">
      <div
        class="tab-pane fade"
        :class="{
          show: tab === 0,
          active: tab === 0,
        }"
        role="tabpanel"
        aria-labelledby="home-tab">
        <form @submit.prevent="submitSearch">
          <form-row :label="'Search'">
            <div class="row">
              <div class="col col-md-10">
                <input
                  v-model="search"
                  type="text"
                  class="form-control">
              </div>
              <div class="col col-md-2">
                <button
                  type="submit"
                  class="btn btn-primary"
                  @click="submitSearch">
                  search
                </button>
              </div>
            </div>
          </form-row>
          <form-row>
            <small class="form-text text-muted label-help">
              Full-text search across vocabulary description, ranked by relevance
            </small>
          </form-row>
        </form>
      </div>
      <div
        class="tab-pane fade"
        :class="{
          show: tab === 1,
          active: tab === 1,
        }"
        role="tabpanel"
        aria-labelledby="profile-tab">
        <form @submit.prevent="submitFilter">
          <form-row :label="'KOS Type'">
            <set-select
              :model-value="{uri:type}"
              :options="kostypes"
              @update:modelValue="type=$event.uri" />
          </form-row>
          <form-row :label="'Languages'">
            <language-select
              v-model="languages"
              :repeatable="true"
              class="form-control" />
          </form-row>
          <form-row :label="'License'">
            <set-select
              :model-value="{uri:license}"
              :options="licenses"
              @update:modelValue="license=$event.uri" />
          </form-row>
          <form-row :label="'Subject'">
            <subject-editor v-model="subjects" />
          </form-row>
          <form-row label="Sorting">
            <div class="form-inline m-1">
              <select
                v-model="sorting"
                class="form-control">
                <option
                  v-for="option in sortOptions"
                  :key="option.name"
                  :value="option">
                  {{ option.name }}
                </option>
              </select>
              <select
                v-if="sort"
                v-model="order"
                class="form-control m-1">
                <option
                  value="asc">
                  ascending
                </option>
                <option value="desc">
                  descending
                </option>
              </select>
            </div>
          </form-row>
          <form-row>
            <button
              type="submit"
              class="btn btn-primary"
              @click="submitFilter">
              filter
            </button>
          </form-row>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import FormRow from "./FormRow.vue"
import SetSelect from "./SetSelect.vue"
import LanguageSelect from "./LanguageSelect.vue"
import SubjectEditor from "./SubjectEditor.vue"

import { indexingSchemes, loadConcepts } from "../utils.js"

// search form
export default {
  components: { FormRow, SetSelect, LanguageSelect, SubjectEditor },
  props: {
    query: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    const sortOptions = [
      {
        name: "newest first",
        sort: "created",
        order: "desc",
      },
      {
        name: "oldest first",
        sort: "created",
        order: "asc",
      },
      {
        name: "recently changed",
        sort: "modified",
        order: "desc",
      },
      {
        name: "by label",
        sort: "label",
        order: "asc",
      },
    ]
    const { type, languages, subject, license, format, access, country, sort = "", order = "asc", search } = this.query
    const sorting = sortOptions.find(s => s.sort === sort && s.order === order)
    const subjects = (subject || "").split("|").map(uri => {
      const scheme = indexingSchemes.find(scheme => uri.indexOf(scheme.namespace) === 0)
      return scheme ? { uri, inScheme: [scheme] } : false
    }).filter(Boolean)
    const tab = (Object.keys(this.query).includes("search") && search) || !Object.keys(this.query).length ? 0 : 1
    return {
      type,
      search,
      languages: (languages||"").split(","),
      subjects,
      license,
      country, // TODO: https://github.com/gbv/bartoc.org/issues/24
      format, // TODO: https://github.com/gbv/bartoc.org/issues/25
      access, // TODO: https://github.com/gbv/bartoc.org/issues/42
      kostypes: [],
      licenses: [],
      tab,
      sortOptions,
      sorting,
    }
  },
  created() {
    const loadVoc = (name, uri) =>
      loadConcepts("https://api.dante.gbv.de/voc/top", uri)
        .then(set => {
          set.unshift({ uri: "", prefLabel: { en: "" } })
          this[name] = set
        })

    loadVoc("kostypes", "http://w3id.org/nkos/nkostype")
    loadVoc("licenses", "http://uri.gbv.de/terminology/license/")
  },
  methods: {
    submit(query) {
      Object.keys(query).filter(key => !query[key]).forEach(key => delete query[key])
      window.location.href = "/vocabularies?" + (new URLSearchParams(query).toString())
    },
    submitSearch() {
      this.submit({ search: this.search })
    },
    submitFilter() {
      const { type, languages, license } = this, sort = this.sorting && this.sorting.sort, order = this.sorting && this.sorting.order
      const query = { type, languages: languages.join(","), license, sort, order }
      if (this.subjects.length) query.subject = this.subjects.map(({ uri }) => uri).join("|")
      this.submit(query)
    },
  },
}
</script>

<style>
.vocabulary-search {
  padding: 1em 0em;
}
.tab-content {
  border: 1px solid #dee2e6;
  border-top: none;
  border-bottom-left-radius: .25rem;
  border-bottom-right-radius: .25rem;
}
.form-group:last-of-type {
  margin-bottom: 0;
}
</style>
