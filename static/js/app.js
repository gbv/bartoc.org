/* Utility functions */

// TODO: use cdk instead
function loadConcepts (api, uri) {
  if (uri) api = `${api}?uri=${encodeURIComponent(uri)}`
  return fetch(api).then(res => res ? res.json() : [])
}

// TODO: configure somewhere else, this is part of BARTOC data anyway
const indexingSchemes = [
  {
    uri: 'http://bartoc.org/en/node/241',
    namespace: 'http://dewey.info/class/',
    notation: ['DDC']
  },
  {
    uri: 'http://bartoc.org/en/node/15',
    namespace: 'http://eurovoc.europa.eu/',
    prefLabel: { en: 'EuroVoc' }
  },
  {
    uri: 'http://bartoc.org/de/node/472',
    namespace: 'http://bartoc.org/en/ILC/',
    notation: ['ILC']
  }
]

/**
 * Establish connection to login server and show logged in user or link to login.
 */
const UserStatus = {
  template: '<a v-if="connected" class="nav-link" :href="\'https://\'+login+\'account\'">{{user ? user.name : \'login\'}}</a>',
  props: {
    login: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      client: new LoginClient(this.login),
      connected: false,
      user: null,
      auth: {}
    }
  },
  emits: ['update:user', 'update:auth'],
  created () {
    const { connect, disconnect, login, logout, update, error, token, about } = LoginClient.events
    this.client.addEventListener(about, ({ publicKey }) => { this.auth.publicKey = publicKey; this._updateAuth() })
    this.client.addEventListener(connect, () => { this.connected = true })
    this.client.addEventListener(disconnect, () => { this.connected = false })
    this.client.addEventListener(login, ({ user }) => { this._setUser(user) })
    this.client.addEventListener(update, ({ user }) => { this._updadeUser(user) })
    this.client.addEventListener(logout, () => { this._setUser(null) })
    this.client.addEventListener(token, ({ token }) => { this.auth.token = token; this._updateAuth() })
    this.client.addEventListener(error, console.warn)
    this.client.connect()
  },
  methods: {
    _updateAuth () {
      this.$emit('update:auth', this.auth.token ? this.auth : null)
    },
    _setUser (user) {
      this.user = user
      this.$emit('update:user', user)
    }
  }
}

/**
 * A row in a form with multiple input fields.
 */
const FormRow = {
  template: `
    <div class="form-group row">
      <label class="col-form-label col-sm-2">{{label}}</label>
      <div class="col-sm-10 font-weight-light">
        <slot/>
      </div>
    </div>`,
  props: {
    label: {
      type: String,
      default: ''
    }
  }
}

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
    repeatable: Boolean
  }
}

const SetEditorMixin = {
  emits: ['update:modelValue'],
  props: {
    modelValue: Array
  },
  data () {
    return {
      set: [...(this.modelValue || [])]
    }
  },
  watch: {
    set: {
      deep: true,
      handler (set) {
        this.$emit('update:modelValue', set)
      }
    }
  },
  methods: {
    add (item) {
      this.set.push(item)
    },
    remove (index) {
      this.set.splice(index, 1)
    }
  }
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
  </table>`
}

function prefLabel (item) {
  if (item && item.prefLabel) {
    if ('en' in item.prefLabel) return item.prefLabel.en
    for (const lang in item.prefLabel) return item.prefLabel[lang]
  }
  return '???'
}

const SubjectEditor = {
  mixins: [SetEditorMixin],
  template: `
<table class="table table-sm table-borderless">
  <tr v-for="(subject,i) in set">
    <td v-if="(subject.inScheme||[]).length">
      {{shortLabel(findScheme(subject.inScheme[0].uri))}}
    </td>
    <td v-else>?</td>
    <td>
      <input type="text" class="form-control" v-model="set[i].uri"/>
    </td><td>
      <button type="button" class="btn btn-outline-primary" @click="remove(i)">x</button>
    </td>
  </tr><tr>
    <td>
      <select class="form-control" v-model="nextScheme">
        <option v-for="scheme in indexingSchemes" :value="scheme.uri">
          {{shortLabel(scheme)}}
        </option>
      </select>
    </td><td>
      <button type="button" class="btn btn-outline-primary" @click="add()">+</button>
      Please use concept URIs (unless <a href="https://github.com/gbv/bartoc.org/issues/12">this issue</a> is solved)!
    </td>
  </tr>
</table>
  `,
  data () {
    return {
      nextScheme: indexingSchemes[0].uri,
      indexingSchemes
    }
  },
  methods: {
    findScheme (uri) {
      return this.indexingSchemes.find(scheme => scheme.uri === uri)
    },
    add () {
      var inScheme = this.findScheme(this.nextScheme)
      inScheme = [{ uri: inScheme.uri }]
      this.set.push({ inScheme, uri: '' })
    },
    shortLabel (item) {
      if (item && item.notation && item.notation.length) return item.notation[0]
      return prefLabel(item)
    }
  }

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
        two-letter code if possible
      </td>
    </tr>
  </table>`,
  props: {
    prefLabel: Object,
    altLabel: Object
  },
  data () {
    return {
      labels: []
    }
  },
  created () {
    for (const language in this.prefLabel) {
      this.add({ label: this.prefLabel[language], language })
    }
    // this will move an altLabel to become a prefLabel when no prefLabel of its language exist!
    for (const language in this.altLabel) {
      this.altLabel[language].forEach(label => this.add({ label, language }))
    }
    this.add()
    this.$watch('labels', l => this.change(l), { deep: true })
  },
  methods: {
    add (label = { label: '', language: '' }) {
      this.labels.push(label)
    },
    remove (i) {
      this.labels.splice(i, 1)
    },
    change (labels) {
      const prefLabel = {}
      const altLabel = {}
      labels.forEach(({ label, language }) => {
        if (!label || !language) return
        const code = language || 'und'
        label = label.trim()
        if (label === '') return
        if (code in altLabel) {
          altLabel[code].push(label)
        } else if (code in prefLabel) {
          altLabel[code] = [label]
        } else {
          prefLabel[code] = label
        }
      })
      this.$emit('update:prefLabel', prefLabel)
      this.$emit('update:altLabel', altLabel)
    }
  }
}

/**
 * Select from multiple options.
 */
const SetSelect = {
  template: `
  <select v-if="repeatable()" v-model="value" multiple :size="options.length" class="form-control">
    <option v-for="opt in options" v-bind:value="{ uri: opt.uri }">{{prefLabel(opt)}}</option>
  </select>
  <select v-else v-model="value" class="form-control">
    <option v-for="opt in options" v-bind:value="{ uri: opt.uri }">{{prefLabel(opt)}}</option>
  </select>`,
  props: {
    modelValue: [Array, Object],
    options: Array
  },
  data () {
    return {
      value: this.repeatable() ? [...this.modelValue] : this.modelValue
    }
  },
  created () {
    this.$watch('value', value => { this.$emit('update:modelValue', value) })
  },
  methods: {
    prefLabel,
    repeatable () { return Array.isArray(this.modelValue) }
  }
}

const AddressEditor = {
  emits: ['update:modelValue'],
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
    modelValue: Object
  },
  data () {
    const { ext, street, locality, code, country } = (this.modelValue || {})
    return { ext, street, locality, code, country }
  },
  created () {
    for (const name of ['ext', 'street', 'locality', 'code', 'country']) {
      this.$watch(name, this.update)
    }
  },
  methods: {
    update () {
      const { ext, street, locality, code, country } = this
      this.$emit('update:modelValue', { ext, street, locality, code, country })
    }
  }
}

const PublisherEditor = {
  emits: ['update:modelValue'],
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
    modelValue: Array
  },
  data () {
    const publisher = ((this.modelValue || [])[0] || {})
    return {
      viaf: publisher.uri,
      name: (publisher.prefLabel || {}).en
    }
  },
  created () {
    const update = function () {
      this.$emit('update:modelValue', [{ uri: this.viaf, prefLabel: { en: this.name } }])
    }
    this.$watch('name', update)
    this.$watch('viaf', update)
  }
}

/**
 * Web form to modify and create vocabulary metadata.
 */
const ItemEditor = {
  components: { FormRow, LabelEditor, LanguageSelect, SetSelect, ListEditor, SubjectEditor, AddressEditor, PublisherEditor },
  template: `
<p>Basic information about the vocabulary:</p>
<form-row :label="'URI'">
  <a v-if="item.uri" :href="item.uri">{{item.uri}}</a>
  <div v-else>
    <input type="text" v-model="uri" class="form-control"/>
    Please leave empty to assign a BARTOC URI! <em>(not implemented yet)</em>
  </div>
</form-row>
<form-row :label="'Title'">
  <label-editor v-model:prefLabel="item.prefLabel" v-model:altLabel="item.altLabel"/>
  The first of each language code is used as preferred title, more as
  alternative titles, translations, abbreviations...
</form-row>
<form-row :label="'Languages'">
  <language-select v-model="item.languages" class="form-control" :repeatable="true"/>
  Comma-separated list of language codes which the vocabulary is available in.
</form-row>
<form-row :label="'Notation'">
  <input type="text" class="form-control" v-model="item.notation[0]" />
  Common, unique acronym or abbreviation the vocabulary is known under.
</form-row>
<form-row :label="'Identifier'">
  <list-editor v-model="item.identifier" />
  Alternative URIs the vocabulary is identified by (e.g. Wikidata URI).
</form-row>
<form-row :label="'Size'">
  <input type="text" class="form-control" v-model="item.extent"/>
  Number of classes, subclasses, taxa, terms, concepts etc. Please add date in parenthesis (YYYY-MM).
</form-row>
<form-row :label="'English Abstract'">
  <textarea id="abstract-en" class="form-control" v-model="abstractEn" rows="8"></textarea>
</form-row>
<form-row :label="'Non-English Abstract'">
  <textarea id="abstract" class="form-control" v-model="abstractUnd" rows="8"></textarea>
  Use quotation marks and original language if copied from another source (e.g. homepage).
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
<p>Fields about how the vocabulary is made available:</p>
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
  Fields required only if concept notations are mapped to concept URIs:
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
</form-row>
<hr>
<p>
  Fields required only for vocabularies used in PICA or MARC databases:
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
    <button v-else class="btn btn-danger">authentification required!</button>
&nbsp;
<button class="btn btn-warning" onclick="location.reload()">reset</button>
  </div>
  <div class="col-sm-4">
   <input type="checkbox" id="showJSKOS" v-model="showJSKOS">&nbsp;<label for="showJSKOS">show JSKOS record</label>
  </div>
</div>
<div class="form-group row" v-if="'status' in status">
  <div class="col-sm-2"></div>
  <div class="col-sm-8">
    <div :class="'alert alert-'+status.status">{{status.message || "!!"}}</div>
  </div>
</div>
<pre v-show="showJSKOS">{{cleanupItem(item)}}</pre>
`,
  props: {
    user: {
      type: Object
    },
    auth: {},
    current: {
      type: Object
    }
  },
  data () {
    // make sure item has iterable fields
    const item = this.current || {}
    ;['prefLabel', 'altLabel', 'definition', 'ADDRESS']
      .forEach(key => { if (!item[key]) item[key] = {} })
    ;['notation', 'identifier', 'languages', 'license', 'type', 'subject', 'subjectOf', 'partOf', 'FORMAT', 'API', 'ACCESS', 'publisher']
      .forEach(key => { if (!item[key]) item[key] = [] })

    const examples = (item.EXAMPLES || []).join(', ')

    var abstractEn = ''
    var abstractUnd = ''

    // make non-English abstract to language code "und"
    for (const code in item.definition) {
      if (code === 'en') abstractEn = item.definition[code][0]
      else abstractUnd = item.definition[code][0]
    }

    return {
      item,
      uri: null, // for new items
      examples,
      abstractEn,
      abstractUnd,
      kostypes: [],
      licenses: [],
      formats: [],
      access: [],
      status: { },
      showJSKOS: false
    }
  },
  computed: {
    type () { return this.item.type.map(uri => ({ uri })) }
  },
  watch: {
    abstractEn: function (s) { this.item.definition.en = [s] },
    abstractUnd: function (s) { this.item.definition.und = [s] },
    examples: function (s) {
      this.item.EXAMPLES = s.split(',').map(s => s.trim()).filter(s => s !== '')
    }
  },

  created () {
    loadConcepts('https://api.dante.gbv.de/voc/top', 'http://uri.gbv.de/terminology/license/')
      .then(set => { this.licenses = set })
    loadConcepts('https://api.dante.gbv.de/voc/top', 'http://w3id.org/nkos/nkostype')
      .then(set => { this.kostypes = set })
    loadConcepts('/api/voc/top', 'http://bartoc.org/en/node/20000')
      .then(set => { this.formats = set })
    loadConcepts('/api/voc/top', 'http://bartoc.org/en/node/20001')
      .then(set => { this.access = set })
    loadConcepts('/registries?format=jskos')
      .then(set => { this.registries = set })
  },
  methods: {
    saveItem () {
      if (!this.user || !this.auth) return
      var uri = this.item.uri
      const method = uri ? 'PUT' : 'POST'
      if (!uri) {
        // TODO: validate uri
        uri = this.uri
      }
      const body = JSON.stringify(this.cleanupItem({ ...this.item, uri }))
      const token = this.auth.token
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      // TODO: don't call if no uri exists or trying to create with existing URI
      fetch('/api/voc', { method, body, headers }).then(res => {
        if (res.ok) {
          window.location.href = '/vocabularies?uri=' + encodeURIComponent(uri)
        }
        Object.assign(this.status, { status: res.ok ? 'success' : 'warning', message: this.statusText })
      })
    },
    cleanupItem (item) {
      const clean = {}
      const type = 'http://www.w3.org/2004/02/skos/core#ConceptScheme'
      if (item.type[0] !== type) item.type.unshift(type)
      for (const key in item) {
        if (!isEmpty(item[key])) clean[key] = item[key]
      }
      return clean
    }
  }
}

function isEmpty (obj) {
  if (obj === '' || obj === null || obj === undefined) return true
  if (Array.isArray(obj)) return obj.every(isEmpty)
  if (typeof obj === 'object') return Object.values(obj).every(isEmpty)
  return false
}

const VocabularySearch = {
  components: { FormRow, SetSelect, LanguageSelect, SubjectEditor },
  template: `
<form @submit.prevent="search">
  <form-row :label="'KOS Type'">
    <set-select :modelValue="{uri:type}" @update:modelValue="type=$event.uri" :options="kostypes" />
  </form-row>
  <form-row :label="'Language'">
    <language-select v-model="languages" class="form-control" />
    language code which the vocabulary is available in (en, fr, es...)
  </form-row>
  <form-row :label="'Subject'">
    <subject-editor v-model="subjects"/>
  </form-row>
  <form-row>
    <input type="submit" class="btn btn-primary" @click="search" title="search" />
  </form-row>
</form>`,
  props: { query: Object },
  data () {
    const { type, languages, subject, license, format, access, country } = this.query
    const subjects = (subject || '').split('|').map(uri => {
      const scheme = indexingSchemes.find(scheme => uri.indexOf(scheme.namespace) === 0)
      return scheme ? { uri, inScheme: [scheme] } : false
    }).filter(Boolean)
    return {
      type,
      languages,
      subjects,
      license, // TODO: https://github.com/gbv/bartoc.org/issues/43
      country, // TODO: https://github.com/gbv/bartoc.org/issues/24
      format, // TODO: https://github.com/gbv/bartoc.org/issues/25
      access, // TODO: https://github.com/gbv/bartoc.org/issues/42
      kostypes: []
    }
  },
  created () {
    loadConcepts('https://api.dante.gbv.de/voc/top', 'http://w3id.org/nkos/nkostype')
      .then(set => {
        set.unshift({ uri: '', prefLabel: { en: '' } })
        this.kostypes = set
      })
  },
  methods: {
    search () {
      const query = {}
      if (this.type) query.type = this.type
      if (this.languages) query.languages = this.languages
      if (this.subjects.length) query.subject = this.subjects.map(({ uri }) => uri).join('|')
      window.location.href = '/vocabularies?' + (new URLSearchParams(query).toString())
    }
  }
}

/**
 * Client side application for user interaction.
 */
const app = {
  components: { UserStatus, ItemEditor, VocabularySearch },
  data () {
    return {
      login: 'coli-conc.gbv.de/login/',
      user: null,
      auth: null
    }
  },
  methods: {
    updateUser (user) {
      this.user = user
    },
    updateAuth (auth) { this.auth = auth }
  }
}

Vue.createApp(app).mount('#app')

/* global Vue, LoginClient, fetch  */
