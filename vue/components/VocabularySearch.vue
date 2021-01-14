<template>
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
  </form>
  <hr>
  <form @submit.prevent="submitFilter">
    <form-row :label="'KOS Type'">
      <set-select
        :model-value="{uri:type}"
        :options="kostypes"
        @update:modelValue="type=$event.uri" />
    </form-row>
    <form-row :label="'Language'">
      <language-select
        v-model="languages"
        class="form-control" />
      language code which the vocabulary is available in (en, fr, es...)
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
    <form-row>
      <button
        type="submit"
        class="btn btn-primary"
        @click="submitFilter">
        filter
      </button>
    </form-row>
  </form>
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
    const { type, languages, subject, license, format, access, country, search } = this.query
    const subjects = (subject || "").split("|").map(uri => {
      const scheme = indexingSchemes.find(scheme => uri.indexOf(scheme.namespace) === 0)
      return scheme ? { uri, inScheme: [scheme] } : false
    }).filter(Boolean)
    return {
      type,
      search,
      languages,
      subjects,
      license,
      country, // TODO: https://github.com/gbv/bartoc.org/issues/24
      format, // TODO: https://github.com/gbv/bartoc.org/issues/25
      access, // TODO: https://github.com/gbv/bartoc.org/issues/42
      kostypes: [],
      licenses: [],
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
      const { type, languages, license } = this
      const query = { type, languages, license }
      if (this.subjects.length) query.subject = this.subjects.map(({ uri }) => uri).join("|")
      this.submit(query)
    },
  },
}
</script>
