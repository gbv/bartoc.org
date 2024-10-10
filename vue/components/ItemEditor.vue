<template>
  <p style="border-top: 1px solid #ddd">
    Basic information about the vocabulary:
  </p>
  <form-row
    v-if="item.uri"
    :label="'URI'">
    <a :href="item.uri">{{ item.uri }}</a>
  </form-row>
  <form-row :label="'Title'">
    <label-editor
      v-model:pref-label="item.prefLabel"
      v-model:alt-label="item.altLabel" />
    The first of each language is used as preferred title, more as
    aliases, translations... Please provide at least an English title.
  </form-row>
  <form-row :label="'Abbreviation'">
    <input
      v-model="item.notation[0]"
      type="text"
      class="form-control">
    Common, unique abbreviation, acronym, or notation the vocabulary is known under.
  </form-row>
  <form-row :label="'Identifier'">
    <list-editor v-model="item.identifier" />
    Alternative URIs the vocabulary is identified by (e.g. Wikidata URI).
  </form-row>
  <form-row :label="'English Abstract'">
    <textarea
      id="abstract-en"
      v-model="abstractEn"
      class="form-control"
      rows="8" />
    Please provide a short description. Better brief than nothing!
  </form-row>
  <form-row :label="'Non-English Abstract'">
    <textarea
      id="abstract"
      v-model="abstractUnd"
      class="form-control"
      rows="8" />
    Use quotation marks and original language if copied from another source (e.g. homepage).
  </form-row>
  <form-row :label="'Languages'">
    <language-select
      v-model="item.languages"
      class="form-control"
      :repeatable="true" />
  </form-row>
  <form-row :label="'Size'">
    <input
      v-model="item.extent"
      type="text"
      class="form-control">
    Number of classes, subclasses, taxa, terms, concepts etc. Please add date in parenthesis (YYYY-MM).
  </form-row>
  <form-row :label="'KOS Types'">
    <set-select
      :model-value="type"
      :options="kostypes"
      @update:modelValue="item.type=$event.map(t=>t.uri)" />
    Use Shift key to deselect or select multiple types.
  </form-row>
  <form-row :label="'Subjects'">
    <subject-editor v-model="item.subject" />
    Please assign at least a DDC main class.
    <!-- TODO: --> More convenient selection of subjects will be added later!
  </form-row>
  <hr>
  <p>How the vocabulary is made available:</p>
  <form-row :label="'Created'">
    <input
      v-model="item.startDate"
      type="text"
      class="form-control"
      maxlength="4">
    The year when the KOS was first created (YYYY).
  </form-row>
  <form-row :label="'License'">
    <set-select
      v-model="item.license"
      :options="licenses" />
    Use Shift key to deselect or select multiple licenses.
  </form-row>
  <form-row :label="'URL'">
    <input
      v-model="item.url"
      type="text"
      class="form-control">
  </form-row>
  <form-row :label="'Additional links'">
    <list-editor
      :model-value="item.subjectOf.map(s=>s.url)"
      @update:modelValue="item.subjectOf=$event.map(url=>({url}))" />
  </form-row>
  <form-row :label="'Formats'">
    <set-select
      v-model="item.FORMAT"
      :options="formats" />
    Select the format(s) in which the KOS is available.
  </form-row>
  <form-row :label="'Access'">
    <set-select
      :model-value="item.ACCESS"
      :options="access" />
    Do you have to register to view the KOS, is it 'hidden' in a licensed database or is it free online?
  </form-row>
  <form-row :label="'Publisher'">
    <publisher-editor v-model="item.publisher" />
    Try to use an institution rather than a person.
  </form-row>
  <form-row :label="'Address'">
    <address-editor v-model="item.ADDRESS" />
  </form-row>
  <form-row label="Contact">
    <input
      v-model="item.CONTACT"
      type="text"
      class="form-control">
    email address of anyone in charge of the vocabulary
  </form-row>
  <form-row label="Listed In">
    <list-editor
      :model-value="item.partOf.map(({uri})=>uri)"
      @update:modelValue="item.partOf=$event.map(uri=>({uri}))" />
    Which <a href="/registries">terminology registries</a> list the vocabulary?
    Please use registry URIs, a more convenient editing form will be added later!
  </form-row>
  <form-row :label="'Vocabulary services'">
    <endpoints-editor v-model="item.API" />
  </form-row>
  <form-row label="Display options">
    <div class="form-check">
      <input
        id="hideNotation"
        v-model="item.DISPLAY.hideNotation"
        type="checkbox"
        class="form-check-input">
      <label
        for="hideNotation"
        class="form-check-label">hide notation</label>
      it is only used as internal identifier
    </div>
    <div class="form-check">
      <input
        id="numericalNotation"
        v-model="item.DISPLAY.numericalNotation"
        type="checkbox"
        class="form-check-input">
      <label
        for="numericalNotation"
        class="form-check-label">numerical notation</label>
      concepts of this vocabulary will be sorted numerically when displayed as a list
    </div>
  </form-row>
  <hr>
  <p>
    Relevant only if concept notations are mapped to concept URIs:
  </p>
  <form-row :label="'namespace'">
    <input
      v-model="item.namespace"
      type="text"
      class="form-control">
  </form-row>
  <form-row :label="'notation pattern'">
    <input
      v-model="item.notationPattern"
      type="text"
      class="form-control">
  </form-row>
  <form-row :label="'URI pattern'">
    <input
      v-model="item.uriPattern"
      type="text"
      class="form-control">
  </form-row>
  <form-row :label="'example notations'">
    <input
      v-model="examples"
      type="text"
      class="form-control">
    Please use comma to separate multiple notations.
  </form-row>
  <hr>
  <p>
    Relevant only for vocabularies used in PICA or MARC databases:
  </p>
  <form-row :label="'MARCSpec'">
    <input
      v-model="item.MARCSPEC"
      type="text"
      class="form-control">
  </form-row>
  <form-row :label="'PICA path'">
    <input
      v-model="item.PICAPATH"
      type="text"
      class="form-control">
  </form-row>
  <form-row :label="'CQL key'">
    <input
      v-model="item.CQLKEY"
      type="text"
      class="form-control">
  </form-row>
  <hr>
  <p>
    By saving you agree to publish the vocabulary metadata as public domain.
    All metadata is editable by the community of
    <a href="/contact">the BARTOC.org editors</a>.
  </p>
  <div class="form-group row">
    <div class="col-sm-2" />
    <div class="col-sm-4">
      <button
        v-if="auth"
        class="btn btn-primary"
        @click="saveItem">
        save
      </button>
      <button
        v-else
        class="btn btn-danger"
        @click="saveItem">
        authentification required!
      </button>
&nbsp;
      <button
        class="btn btn-warning"
        onclick="location.reload()">
        reset
      </button>
    </div>
    <div class="col-sm-4">
      <input
        id="showJSKOS"
        v-model="showJSKOS"
        type="checkbox">&nbsp;<label for="showJSKOS">show JSKOS record</label>
    </div>
  </div>
  <div
    v-if="error"
    class="form-group row">
    <div class="col-sm-2" />
    <div class="col-sm-8">
      <div class="alert alert-warning">
        <p>error {{ error.status }}: {{ error.message }}</p>
        <p
          v-if="error.html"
          v-html="error.html" />
      </div>
    </div>
  </div>
  <pre v-show="showJSKOS">{{ cleanupItem(item) }}</pre>
</template>

<script>
import { loadConcepts } from "../utils.js"

import FormRow from "./FormRow.vue"
import SetSelect from "./SetSelect.vue"
import LanguageSelect from "./LanguageSelect.vue"
import LabelEditor from "./LabelEditor.vue"
import SubjectEditor from "./SubjectEditor.vue"
import ListEditor from "./ListEditor.vue"
import AddressEditor from "./AddressEditor.vue"
import EndpointsEditor from "./EndpointsEditor.vue"

const PublisherEditor = {
  emits: ["update:modelValue"],
  template: `
  <table class="table table-sm table-borderless">
    <tbody>
      <tr>
        <td><input type="text" class="form-control" v-model="name"/></td>
        <td>Name</td>
      </tr><tr>
        <td><input type="text" class="form-control" v-model="viaf"/></td>
        <td><a href="http://viaf.org/">VIAF</a> URI</td>
      </tr>
    </tbody>
  </table>`,
  props: {
    modelValue: Array,
  },
  data() {
    const publisher = ((this.modelValue || [])[0] || {})
    return {
      viaf: publisher.uri,
      name: (publisher.prefLabel || {}).en,
    }
  },
  created() {
    const update = function () {
      this.$emit("update:modelValue", [{ uri: this.viaf, prefLabel: { en: this.name } }])
    }
    this.$watch("name", update)
    this.$watch("viaf", update)
  },
}

function githubIssueUrl(title, body) {
  return "https://github.com/gbv/bartoc.org/issues/new" +
    "?title=" + encodeURIComponent(title) +
    "&body=" + encodeURIComponent(body)
}

/**
 * Web form to modify and create vocabulary metadata.
 */
export default {
  components: { FormRow, LabelEditor, LanguageSelect, SetSelect, ListEditor, SubjectEditor, AddressEditor, PublisherEditor, EndpointsEditor },
  props: {
    user: {
      type: Object,
      default: () => undefined,
    },
    auth: {
      type: Object,
      default: () => undefined,
    },
    current: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    // make sure item has iterable fields
    const item = this.current || {};
    ["prefLabel", "altLabel", "definition", "ADDRESS", "DISPLAY"]
      .forEach(key => {
        if (!item[key]) {
          item[key] = {}
        }
      });
    ["notation", "identifier", "languages", "license", "type", "subject", "subjectOf", "partOf", "FORMAT", "API", "ACCESS", "publisher"]
      .forEach(key => {
        if (!item[key]) {
          item[key] = []
        }
      })

    const examples = (item.notationExamples || []).join(", ")

    let abstractEn = "", abstractUnd = ""

    // make non-English abstract to language code "und"
    for (const code in item.definition) {
      if (code === "en") {
        abstractEn = item.definition[code][0]
      } else {
        abstractUnd = item.definition[code][0]
      }
    }

    return {
      item,
      examples,
      abstractEn,
      abstractUnd,
      kostypes: [],
      licenses: [],
      formats: [],
      access: [],
      error: null,
      showJSKOS: false,
    }
  },
  computed: {
    type() {
      return this.item.type.map(uri => ({ uri }))
    },
  },
  watch: {
    abstractEn: function (s) {
      this.item.definition.en = [s]
    },
    abstractUnd: function (s) {
      this.item.definition.und = [s]
    },
    examples: function (s) {
      this.item.notationExamples = s.split(",").map(s => s.trim()).filter(s => s !== "")
    },
  },

  created() {
    loadConcepts("https://api.dante.gbv.de/voc/top", "http://uri.gbv.de/terminology/license/")
      .then(set => {
        this.licenses = set
      })
    loadConcepts("/api/voc/top", "http://w3id.org/nkos/nkostype")
      .then(set => {
        this.kostypes = set
      })
    loadConcepts("/api/voc/top", "http://bartoc.org/en/node/20000")
      .then(set => {
        this.formats = set
      })
    loadConcepts("/api/voc/top", "http://bartoc.org/en/node/20001")
      .then(set => {
        this.access = set
      })
    loadConcepts("/registries?format=jskos")
      .then(set => {
        this.registries = set
      })
  },
  methods: {
    itemError() {
      if (!Object.keys(this.item.prefLabel).length) {
        return { message: "item must have at least a title!" }
      }
      // TODO: add more validation
    },
    async saveItem() {
      this.error = this.itemError()
      if (this.error) {
        return
      }

      const item = { ...this.item }
      const method = item.uri ? "PUT" : "POST"
      if (!item.uri) {
        // Try to find an URI not taken yet.
        // TODO: better use auto-increment at jskos-server?
        const total = await fetch("/api/voc?limit=1").then(res => res.headers.get("x-total-count"))
        item.uri = "http://bartoc.org/en/node/" + (17002 + 1 * total)
      }
      const body = JSON.stringify(this.cleanupItem(item), null, 2)
      const headers = { "Content-Type": "application/json" }
      if (this.auth) {
        headers.Authorization = `Bearer ${this.auth.token}`
      }

      const onError = (error, res) => {
        const message = error.message || res.StatusText
        const issue = "This JSKOS record could not be saved:\n\n~~~json\n" + body + "\n~~~\n" +
          "The request included " + (this.auth ? "a token for authentification." : "no token.")
        const url = githubIssueUrl(`Error ${res.status} when saving`, issue)
        const html = `If you think this is a bug, please
                  <a href='${url}'>open a GitHub issue</a> including the current JSKOS record!`
        this.error = { message, status: res.status, html }
      }

      fetch("/api/voc", { method, body, headers }).then(res => {
        if (res.ok) {
          window.location.href = "/vocabularies?uri=" + encodeURIComponent(item.uri)
        } else {
          res.json().then(err => onError(err, res))
            .catch(() => onError({}, res))
        }
      })
    },
    cleanupItem(item) {
      const type = "http://www.w3.org/2004/02/skos/core#ConceptScheme"
      if (item.type[0] !== type) {
        item.type.unshift(type)
      }
      item = filtered(item)
      if (item.API) {
        item.API = item.API.filter(endpoint => endpoint.url)
      }
      if (item.subject) {
        item.subject = item.subject.map(({uri,inScheme,notation}) => {
          inScheme = inScheme.map(({uri}) => ({uri}))
          return {uri,inScheme,notation}
        })
      }
      return item
    },
  },
}

// recursively remove empty JSKOS fields
function filtered(value) {
  if (value && typeof value === "object") {
    if (Array.isArray(value)) {
      value = value.map(filtered).filter(Boolean)
      return value.length ? value : null
    } else {
      const keys =
        ("uri" in value && !value.uri) ? [] // remove object without URI
          : Object.keys(value).filter(key => key[0] !== "_").sort()
      const obj = keys.reduce((obj, key) => {
        const fieldValue = filtered(value[key])
        if (fieldValue) {
          obj[key] = fieldValue
        }
        return obj
      }, {})
      return Object.keys(obj).length ? obj : null
    }
  } else {
    return value
  }
}
</script>
