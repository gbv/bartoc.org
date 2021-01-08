import FormRow from "./FormRow.vue"
import SetSelect from "./SetSelect.vue"
import ItemName from "./ItemName.vue"

/* Utility functions */

// TODO: use cdk instead
function loadConcepts(api, uri) {
  if (uri) api = `${api}?uri=${encodeURIComponent(uri)}`
  return fetch(api).then(res => res ? res.json() : [])
}

// TODO: configure somewhere else, this is part of BARTOC data anyway
const indexingSchemes = [
  {
    uri: "http://bartoc.org/en/node/241",
    namespace: "http://dewey.info/class/",
    notation: ["DDC"],
  },
  {
    uri: "http://bartoc.org/en/node/15",
    namespace: "http://eurovoc.europa.eu/",
    prefLabel: { en: "EuroVoc" },
  },
  {
    uri: "http://bartoc.org/de/node/472",
    namespace: "http://bartoc.org/en/ILC/",
    notation: ["ILC"],
  },
]

/**
 * Select one or a list of languages (should be extened to show full language names).
 */
const LanguageSelect = {
  template: `
  <input v-if="repeatable" type="text" :value="(modelValue||[]).join(', ')"
         @input="$emit('update:modelValue', $event.target.value.split(/\\s*,\\s*/))"/>
  <input v-else type="text" maxlength="3" size="3" :value="modelValue"
         @input="$emit('update:modelValue', $event.target.value)"/>`,
  props: {
    modelValue: [String, Array],
    repeatable: Boolean,
  },
}

const SetEditorMixin = {
  emits: ["update:modelValue"],
  props: {
    modelValue: Array,
  },
  data() {
    return {
      set: [...(this.modelValue || [])],
    }
  },
  watch: {
    set: {
      deep: true,
      handler(set) {
        this.$emit("update:modelValue", set)
      },
    },
  },
  methods: {
    add(item) {
      this.set.push(item)
    },
    remove(index) {
      this.set.splice(index, 1)
    },
  },
}

/**
 * Edit a list of strings.
 */
const ListEditor = {
  mixins: [SetEditorMixin],
  template: `
  <table class="table table-sm table-borderless">
    <tr v-for="(entry,i) in set">
      <td>
        <input type="text" class="form-control" v-model="set[i]"/>
      </td><td>
        <button type="button" class="btn btn-outline-primary" @click="remove(i)">x</button>
      </td>
    </tr><tr>
      <td>
        <button type="button" class="btn btn-outline-primary" @click="add('')">+</button>
      </td>
    </tr>
  </table>`,
}

const ItemInput = {
  components: { ItemName },
  template: `
      <input v-show="hasFocus || !item.uri" @focus="hasFocus=true" @blur="hasFocus=false" ref="input" type="text" class="form-control" v-model="item.uri" v-on:keyup.enter="$event.target.blur()"/>
      <div v-if="!hasFocus" @click="edit()">
       <item-name :item="item" :notation="true"/>
      <a href="" @focus="edit()"/>
    </div>`,
  props: {
    modelValue: Object,
  },
  data() {
    return {
      item: this.modelValue,
      hasFocus: false,
      loaded: null,
    }
  },
  watch: {
    item: {
      deep: true,
      handler(item) {
        this.$emit("update:modelValue", item)
        if (this.loaded !== item.uri) {
          this.loaded = item.uri
          this.loadDetails()
        }
      },
    },
  },
  created() {
    this.loadDetails()
  },
  methods: {
    edit() {
      this.hasFocus = true
      this.$nextTick(() => {
        this.$refs.input.focus()
      })
    },
    loadDetails() {
      const { uri, inScheme } = this.item
      loadConcepts("/api/data", uri).then(res => {
        this.item = res[0] || { uri, inScheme }
      })
    },

  },
}

const SubjectEditor = {
  mixins: [SetEditorMixin],
  components: { ItemInput, ItemName },
  template: `
<table class="table table-sm table-borderless">
  <tr v-for="(subject,i) in set">
    <td v-if="(subject.inScheme||[]).length">
      <item-name :item="findScheme(subject.inScheme[0].uri)" :notation="true" :prefLabel="false" />
    </td>
    <td v-else>?</td>
    <td class="item-input">
      <item-input v-model="set[i]"/>
   </td><td>
      <button type="button" class="btn btn-outline-primary" @click="remove(i)">x</button>
    </td>
  </tr><tr>
    <td>
      <select class="form-control" v-model="nextScheme">
        <option v-for="scheme in indexingSchemes" :value="scheme.uri">
          <item-name :item="scheme" :notation="true" :prefLabel="false" />
        </option>
      </select>
    </td><td>
      <button type="button" class="btn btn-outline-primary" @click="add()">+</button>
      Please use concept URIs (unless <a href="https://github.com/gbv/bartoc.org/issues/12">this issue</a> is solved)!
    </td>
  </tr>
</table>
  `,
  data() {
    return {
      nextScheme: indexingSchemes[0].uri,
      indexingSchemes,
    }
  },
  methods: {
    findScheme(uri) {
      return this.indexingSchemes.find(scheme => scheme.uri === uri)
    },
    add() {
      var inScheme = this.findScheme(this.nextScheme)
      inScheme = [{ uri: inScheme.uri }]
      this.set.push({ inScheme, uri: "" })
    },
  },
}

/**
 * Edit prefLabel (first of each language) and alternativeLabel.
 */
const LabelEditor = {
  components: { LanguageSelect },
  template: `
  <table class="table table-sm table-borderless">
    <tr><th>title</th><th colspan="2">language code</th></tr>
    <tr v-for="(label,i) in labels">
      <td>
        <input type="text" class="form-control" v-model="label.label"/>
      </td><td>
        <language-select v-model="label.language" class="form-control"/>
      </td><td>
        <button type="button" class="btn btn-outline-primary" @click="remove(i)">x</button>
      </td>
    </tr>
    <tr>
      <td>
        <button type="button" class="btn btn-outline-primary" @click="add()">+</button>
      </td>
      <td colspan="2">
        two-letter code if possible, three letter otherwise.
      </td>
    </tr>
  </table>`,
  props: {
    prefLabel: Object,
    altLabel: Object,
  },
  data() {
    return {
      labels: [],
    }
  },
  created() {
    for (const language in this.prefLabel) {
      this.add({ label: this.prefLabel[language], language })
    }
    // this will move an altLabel to become a prefLabel when no prefLabel of its language exist!
    for (const language in this.altLabel) {
      this.altLabel[language].forEach(label => this.add({ label, language }))
    }
    this.add()
    this.$watch("labels", l => this.change(l), { deep: true })
  },
  methods: {
    add(label = { label: "", language: "" }) {
      this.labels.push(label)
    },
    remove(i) {
      this.labels.splice(i, 1)
    },
    change(labels) {
      const prefLabel = {}
      const altLabel = {}
      labels.forEach(({ label, language }) => {
        if (!label) return
        const code = language || "und"
        label = label.trim()
        if (label === "") return
        if (code in altLabel) {
          altLabel[code].push(label)
        } else if (code in prefLabel) {
          altLabel[code] = [label]
        } else {
          prefLabel[code] = label
        }
      })
      this.$emit("update:prefLabel", prefLabel)
      this.$emit("update:altLabel", altLabel)
    },
  },
}

const AddressEditor = {
  emits: ["update:modelValue"],
  template: `
  <table class="table-sm">
    <tr>
      <td>Street address</td>
      <td><input type="text" class="form-control" v-model="street"/></td>
    </tr><tr>
      <td></td>
      <td><input type="text" class="form-control" v-model="ext"/></td>
    </tr><tr>
      <td>City</td>
      <td><input type="text" class="form-control" v-model="locality"/></td>
    </tr><tr>
      <td>Postal code</td>
      <td><input type="text" class="form-control" v-model="code"/></td>
    </tr><tr>
      <td>Country</td>
      <td><input type="text" class="form-control" v-model="country"/></td>
    </tr>
  </table>
  `,
  props: {
    modelValue: Object,
  },
  data() {
    const { ext, street, locality, code, country } = (this.modelValue || {})
    return { ext, street, locality, code, country }
  },
  created() {
    for (const name of ["ext", "street", "locality", "code", "country"]) {
      this.$watch(name, this.update)
    }
  },
  methods: {
    update() {
      const { ext, street, locality, code, country } = this
      this.$emit("update:modelValue", { ext, street, locality, code, country })
    },
  },
}

const PublisherEditor = {
  emits: ["update:modelValue"],
  template: `
  <table class="table table-sm table-borderless">
    <tr>
      <td><input type="text" class="form-control" v-model="name"/></td>
      <td>Name</td>
    </tr><tr>
      <td><input type="text" class="form-control" v-model="viaf"/></td>
      <td><a href="http://viaf.org/">VIAF</a> URI</td>
    </tr>
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
const ItemEditor = {
  components: { FormRow, LabelEditor, LanguageSelect, SetSelect, ListEditor, SubjectEditor, AddressEditor, PublisherEditor },
  template: `
<p style="border-top: 1px solid #ddd">Basic information about the vocabulary:</p>
<form-row :label="'URI'" v-if="item.uri">
  <a :href="item.uri">{{item.uri}}</a>
</form-row>
<form-row :label="'Title'">
  <label-editor v-model:prefLabel="item.prefLabel" v-model:altLabel="item.altLabel"/>
  The first of each language code is used as preferred title, more as
  aliases, translations... Please provide at least an English title.
</form-row>
<form-row :label="'Abbreviation'">
  <input type="text" class="form-control" v-model="item.notation[0]" />
  Common, unique abbreviation, acronym, or notation the vocabulary is known under.
</form-row>
<form-row :label="'Identifier'">
  <list-editor v-model="item.identifier" />
  Alternative URIs the vocabulary is identified by (e.g. Wikidata URI).
</form-row>
<form-row :label="'English Abstract'">
  <textarea id="abstract-en" class="form-control" v-model="abstractEn" rows="8"></textarea>
  Please provide a short description. Better brief than nothing!
</form-row>
<form-row :label="'Non-English Abstract'">
  <textarea id="abstract" class="form-control" v-model="abstractUnd" rows="8"></textarea>
  Use quotation marks and original language if copied from another source (e.g. homepage).
</form-row>
<form-row :label="'Languages'">
  <language-select v-model="item.languages" class="form-control" :repeatable="true"/>
  Comma-separated list of language codes which the vocabulary is available in.
</form-row>
<form-row :label="'Size'">
  <input type="text" class="form-control" v-model="item.extent"/>
  Number of classes, subclasses, taxa, terms, concepts etc. Please add date in parenthesis (YYYY-MM).
</form-row>
<form-row :label="'KOS Types'">
  <set-select :modelValue="type"
              @update:modelValue="item.type=$event.map(t=>t.uri)"
              :options="kostypes" />
  Use Shift key to deselect or select multiple types.
</form-row>
<form-row :label="'Subjects'">
  <subject-editor v-model="item.subject"/>
  Please assign at least a DDC main class.
  <!-- TODO: --> More convenient selection of subjects will be added later!
</form-row>
<hr>
<p>How the vocabulary is made available:</p>
<form-row :label="'Created'">
  <input type="text" class="form-control" v-model="item.startDate" maxlength="4"/>
  The year when the KOS was first created (YYYY).
</form-row>
<form-row :label="'License'">
  <set-select v-model="item.license" :options="licenses" />
  Use Shift key to deselect or select multiple licenses.
</form-row>
<form-row :label="'URL'">
  <input type="text" class="form-control" v-model="item.url" />
</form-row>
<form-row :label="'Additional links'">
  <list-editor :modelValue="item.subjectOf.map(s=>s.url)"
               @update:modelValue="item.subjectOf=$event.map(url=>({url}))" />
</form-row>
<form-row :label="'Formats'">
  <set-select v-model="item.FORMAT" :options="formats" />
  Select the format(s) in which the KOS is available.
</form-row>
<form-row :label="'Access'">
  <set-select :modelValue="item.ACCESS"
              :options="access"/>
  Do you have to register to view the KOS, is it 'hidden' in a licensed database or is it free online?
</form-row>
<form-row :label="'Publisher'">
  <publisher-editor v-model="item.publisher" />
  Try to use an institution rather than a person.
</form-row>
<form-row :label="'Address'">
  <address-editor v-model="item.ADDRESS" />
</form-row>
<form-row :label="'Contact'">
  <input type="text" class="form-control" v-model="item.CONTACT"/>
  email address of anyone in charge of the vocabulary
</form-row>
<form-row :label="'Listed In'">
  <list-editor :modelValue="item.partOf.map(({uri})=>uri)"
               @update:modelValue="item.partOf=$event.map(uri=>({uri}))" />
  Which <a href="/registries">terminology registries</a> list the vocabulary?
  Please use registry URIs, a more convenient editing form will be added later!
</form-row>
<form-row :label="'Vocabulary services'">
  <list-editor v-model="item.API" />
  Endpoints of vocabulary services
  (<a href="http://skosmos.org/">Skosmos</a>,
   <a href="https://github.com/gbv/jskos-server#readme">jskos-server</a>...)
  to query the vocabulary.
</form-row>
<hr>
<p>
  Relevant only if concept notations are mapped to concept URIs:
</p>
<form-row :label="'namespace'">
  <input type="text" class="form-control" v-model="item.namespace"/>
</form-row>
<form-row :label="'notation pattern'">
  <input type="text" class="form-control" v-model="item.notationPattern"/>
</form-row>
<form-row :label="'URI pattern'">
  <input type="text" class="form-control" v-model="item.uriPattern"/>
</form-row>
<form-row :label="'example notations'">
  <input type="text" class="form-control" v-model="examples"/>
  Please use comma to separate multiple notations.
</form-row>
<hr>
<p>
  Relevant only for vocabularies used in PICA or MARC databases:
</p>
<form-row :label="'MARCSpec'">
  <input type="text" class="form-control" v-model="item.MARCSPEC"/>
</form-row>
<form-row :label="'PICA path'">
  <input type="text" class="form-control" v-model="item.PICAPATH"/>
</form-row>
<form-row :label="'CQL key'">
  <input type="text" class="form-control" v-model="item.CQLKEY"/>
</form-row>
<hr>
<p>
 By saving you agree to publish the vocabulary metadata as public domain.
 All metadata is editable by the community of
 <a href="/contact">the BARTOC.org editors</a>.
</p>
<div class="form-group row">
  <div class="col-sm-2"></div>
  <div class="col-sm-4">
    <button v-if="auth" class="btn btn-primary" @click="saveItem">save</button>
    <button v-else class="btn btn-danger" @click="saveItem">authentification required!</button>
&nbsp;
<button class="btn btn-warning" onclick="location.reload()">reset</button>
  </div>
  <div class="col-sm-4">
   <input type="checkbox" id="showJSKOS" v-model="showJSKOS">&nbsp;<label for="showJSKOS">show JSKOS record</label>
  </div>
</div>
<div class="form-group row" v-if="error">
  <div class="col-sm-2"></div>
  <div class="col-sm-8">
    <div class="alert alert-warning">
      <p>error {{error.status}}: {{error.message}}</p>
      <p v-if="error.html" v-html="error.html"></p>
    </div>
  </div>
</div>
<pre v-show="showJSKOS">{{cleanupItem(item)}}</pre>
`,
  props: {
    user: {
      type: Object,
    },
    auth: {},
    current: {
      type: Object,
    },
  },
  data() {
    // make sure item has iterable fields
    const item = this.current || {};
    ["prefLabel", "altLabel", "definition", "ADDRESS"]
      .forEach(key => { if (!item[key]) item[key] = {} });
    ["notation", "identifier", "languages", "license", "type", "subject", "subjectOf", "partOf", "FORMAT", "API", "ACCESS", "publisher"]
      .forEach(key => { if (!item[key]) item[key] = [] })

    const examples = (item.EXAMPLES || []).join(", ")

    var abstractEn = ""
    var abstractUnd = ""

    // make non-English abstract to language code "und"
    for (const code in item.definition) {
      if (code === "en") abstractEn = item.definition[code][0]
      else abstractUnd = item.definition[code][0]
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
    type() { return this.item.type.map(uri => ({ uri })) },
  },
  watch: {
    abstractEn: function (s) { this.item.definition.en = [s] },
    abstractUnd: function (s) { this.item.definition.und = [s] },
    examples: function (s) {
      this.item.EXAMPLES = s.split(",").map(s => s.trim()).filter(s => s !== "")
    },
  },

  created() {
    loadConcepts("https://api.dante.gbv.de/voc/top", "http://uri.gbv.de/terminology/license/")
      .then(set => { this.licenses = set })
    loadConcepts("https://api.dante.gbv.de/voc/top", "http://w3id.org/nkos/nkostype")
      .then(set => { this.kostypes = set })
    loadConcepts("/api/voc/top", "http://bartoc.org/en/node/20000")
      .then(set => { this.formats = set })
    loadConcepts("/api/voc/top", "http://bartoc.org/en/node/20001")
      .then(set => { this.access = set })
    loadConcepts("/registries?format=jskos")
      .then(set => { this.registries = set })
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
      if (this.error) return

      const item = { ...this.item }
      const method = item.uri ? "PUT" : "POST"
      if (item.uri) {
        // TODO: check other user identities
        // TODO: should be set at server
        item.modified = (new Date()).toISOString()
        if (this.user) {
          if (!(item.creator || []).find(c => c.uri === this.user.uri)) {
            item.contributor = item.contributor || []
            if (!item.contributor.find(c => c.uri === this.user.uri)) {
              item.contributor.push({ uri: this.user.uri, prefLabel: { en: this.user.name } })
            }
          }
        }
      } else { // guess an URI not taken yet
        const total = await fetch("/api/voc?limit=1").then(res => res.headers.get("x-total-count"))
        item.uri = "http://bartoc.org/en/node/" + (17000 + 1 * total)
        // TODO: should be set at server
        item.created = (new Date()).toISOString()
        if (this.user) {
          item.creator = [{ uri: this.user.uri, prefLabel: { en: this.user.name } }]
        }
      }
      const body = JSON.stringify(this.cleanupItem(item), null, 2)
      const headers = { "Content-Type": "application/json" }
      if (this.auth) headers.Authorization = `Bearer ${this.auth.token}`

      const onError = (error, res) => {
        var message = error.message || res.StatusText
        var issue = "This JSKOS record could not be saved:\n\n~~~json\n" + body + "\n~~~\n" +
          "The request included " + (this.auth ? "a token for authentification." : "no token.")
        var url = githubIssueUrl(`Error ${res.status} when saving`, issue)
        var html = `If you think this is a bug, please
                  <a href='${url}'>open a GitHub issue</a> including the current JSKOS record!`
        this.error = { message, status: res.status, html }
      }

      fetch("/api/voc", { method, body, headers }).then(res => {
        if (res.ok) {
          window.location.href = "/vocabularies?uri=" + encodeURIComponent(item.uri)
        } else {
          res.json().then(err => onError(err, res))
            .catch(() => onError({}, res)) // eslint-disable-line handle-callback-err
        }
      })
    },
    cleanupItem(item) {
      const type = "http://www.w3.org/2004/02/skos/core#ConceptScheme"
      if (item.type[0] !== type) item.type.unshift(type)
      return filtered(item)
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
        if (fieldValue) obj[key] = fieldValue
        return obj
      }, {})
      return Object.keys(obj).length ? obj : null
    }
  } else {
    return value
  }
}

// search form
const VocabularySearch = {
  components: { FormRow, SetSelect, LanguageSelect, SubjectEditor },
  template: `
<form @submit.prevent="submitSearch">
  <form-row :label="'Search'">
    <div class="row">
      <div class="col col-md-10">
        <input type="text" v-model="search" class="form-control"/>
      </div>
      <div class="col col-md-2">
        <button type="submit" class="btn btn-primary" @click="submitSearch">search</button>
      </div>
    </div>
  </form-row>
</form>
<hr>
<form @submit.prevent="submitFilter">
  <form-row :label="'KOS Type'">
    <set-select :modelValue="{uri:type}" @update:modelValue="type=$event.uri" :options="kostypes" />
  </form-row>
  <form-row :label="'Language'">
    <language-select v-model="languages" class="form-control" />
    language code which the vocabulary is available in (en, fr, es...)
  </form-row>
  <form-row :label="'License'">
    <set-select :modelValue="{uri:license}" @update:modelValue="license=$event.uri" :options="licenses" />
  </form-row>
  <form-row :label="'Subject'">
    <subject-editor v-model="subjects"/>
  </form-row>
  <form-row>
    <button type="submit" class="btn btn-primary" @click="submitFilter">filter</button>
  </form-row>
</form>`,
  props: { query: Object },
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

export {
  ItemEditor,
  VocabularySearch,
}
