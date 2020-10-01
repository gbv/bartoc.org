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
 * A row in the form to edit vocabulary metadata.
 */
const FormRow = {
  template: `
    <div class="form-group row">
      <label class="col-form-label col-sm-2">{{label}}</label>
      <div class="col-sm-10" class="font-weight-light">
        <slot/>
      </div>
    </div>`,
  props: ['label']
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

/**
 * Edit an array list of strings.
 */
const ListEditor = {
  template: `
  <table>
    <tr v-for="(entry,i) in list"><td>
      <input type="text" class="form-control" v-model="entry"/></td><td>
      <button type="button" class="btn btn-outline-primary btn-sm"
              @click="list.splice(i,1)">x</button>
      </td>
    </tr>
    <tr><td>
    <button type="button" class="btn btn-outline-primary btn-sm"
            @click="list.push('')">+</button>
    </td></tr>
  </table>`,
  props: {
    modelValue: Array
  },
  data () {
    return {
      list: [...(this.modelValue || [])]
    }
  },
  created () {
    this.$watch('list', a => this.$emit('update:modelValue', a), { deep: true })
  }
}

/**
 * Edit prefLabel (first of each language) and alternativeLabel.
 */
const LabelEditor = {
  components: { LanguageSelect },
  template: `<table>
    <tr><th>title</th><th>language code</th></tr>
    <tr v-for="(label,i) in labels">
      <td>
        <input type="text" class="form-control" v-model="label.label"/>
      </td>
      <td class="form-inline">
        <language-select v-model="label.language" class="form-control"/>
        &nbsp;
        <button type="button" class="btn btn-outline-primary btn-sm" @click="remove(i)">x</button>
      </td>
    </tr>
    <tr>
      <td>
        <button type="button" class="btn btn-outline-primary btn-sm" @click="add()">+</button>
      </td>
      <td>
        two-letter code if possible
      </td>
    </tr>
  </table>`,
  props: {
    prefLabel: Object,
    altLabel: Object
  },
  data () {
    const labels = []
    return {
      labels
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

function prefLabel (item) {
  if (item && item.prefLabel) {
    if ('en' in item.prefLabel) return item.prefLabel.en
    for (const lang in item.prefLabel) return item.prefLabel[lang]
  }
  return '???'
}

/**
 * Select from multiple options.
 */
const SetSelect = {
  template: `
      <select v-model="set" multiple :size="options.length" class="form-control">
        <option v-for="opt in options" v-bind:value="{ uri: opt.uri }">{{prefLabel(opt)}}</option>
      </select>
`,
  props: {
    modelValue: Array,
    options: Array
  },
  data () {
    return { set: [] }
  },
  created () {
    this.$watch('set', set => { this.$emit('update:modelValue', set) })
  },
  methods: { prefLabel }
}

/**
 * Web form to modify and create vocabulary metadata.
 */
const ItemEditor = {
  components: { FormRow, LabelEditor, LanguageSelect, SetSelect, ListEditor },
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
  <table>
    <tr v-for="(entry,i) in item.identifier" :key="i"><td>
      <input type="text" class="form-control" v-model="item.identifier[i]"/></td><td>
      <button type="button" class="btn btn-outline-primary btn-sm"
              @click="item.identifier.splice(i,1)">x</button>
      </td>
    </tr>
    <tr><td>
    <button type="button" class="btn btn-outline-primary btn-sm"
            @click="item.identifier.push('')">+</button>
    </td></tr>
  </table>
  Alternative URIs the vocabulary is identified by (e.g. Wikidata URI).
</form-row>
<form-row :label="'Size'">
  <input type="text" class="form-control" v-model="item.extent"/>
  Number of classes, subclasses, taxa, terms, concepts etc. Please add date in parenthesis (YYYY-MM).
</form-row>
<form-row :label="'English Abstract'">
  <textarea id="abstract-en" class="form-control" v-model="abstractEn"></textarea>
</form-row>
<form-row :label="'Non-English Abstract'">
  <textarea id="abstract" class="form-control" v-model="abstractUnd"></textarea>
  Use quotation marks and original language if copied from another source (e.g. homepage).
</form-row>
<form-row :label="'KOS Types'">
  <set-select :modelValue="item.type" @update:modelValue="item.type=$event.map(t=>t.uri)" :options="kostypes" />
</form-row>
<form-row :label="'Subjects'">
  ...DDC Main Class (one or more), DDC (one or more), EuroVoc, ILC...
</form-row>
<hr>
<p>Fields about how the vocabulary is made available:</p>
<form-row :label="'Created'">
  <input type="text" class="form-control" v-model="item.startDate" maxlength="4"/>
  The year when the KOS was first created (YYYY).
</form-row>
<form-row :label="'License'">
  <set-select v-model="item.license" :options="licenses" />
</form-row>
<form-row :label="'Links'">
  ...
  was repeatable on original BARTOC, now unique!
</form-row>
<form-row :label="'Publisher'">
  ...author, address, location, VIAF
  Try to use an institution rather than a person. repeatable?
</form-row>
<form-row :label="'Formats'">
  ...
  Select the format(s) in which the KOS is available.
</form-row>
<form-row :label="'Access'">
  ...
  Do you have to register to take a look at the KOS, is it 'hidden' in a licensed database or is it free online?
</form-row>
<form-row :label="'Contact'">
  ...
</form-row>
<form-row :label="'Listed In'">
  ...repeatable
</form-row>
<form-row :label="'Vocabulary services'">
  ...repeatable
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
    const item = this.current || {}
    ;['prefLabel', 'altLabel', 'definition'].forEach(key => { if (!item[key]) item[key] = {} })
    ;['notation', 'identifier', 'license', 'type'].forEach(key => { if (!item[key]) item[key] = [] })

    const examples = (item.EXAMPLES || []).join(', ')

    var abstractEn = ''
    var abstractUnd = ''

    // make non-English abstract to language code "und"
    for (const code in item.definition) {
	    if (code === 'en') abstractEn = item.definition[code][0]
	    else abstractUnd = item.definition[code][0]
    }

    // TODO: use cdk instead. Catch error.
    fetch('https://api.dante.gbv.de/voc/top?uri=http%3A%2F%2Furi.gbv.de%2Fterminology%2Flicense%2F').then(res => res.json())
      .then(res => { this.licenses = res })
    fetch('https://api.dante.gbv.de/voc/top?uri=http%3A%2F%2Fw3id.org%2Fnkos%2Fnkostype').then(res => res.json())
      .then(res => { this.kostypes = res })

    return {
      item,
      uri: null, // for new items
      examples,
      abstractEn,
      abstractUnd,
      kostypes: [],
      licenses: [],
      status: { },
      showJSKOS: false
    }
  },
  watch: {
    abstractEn: function (s) { this.item.definition.en = [s] },
    abstractUnd: function (s) { this.item.definition.und = [s] },
    examples: function (s) {
      this.item.EXAMPLES = s.split(',').map(s => s.trim()).filter(s => s !== '')
    }
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

/**
 * Client side application for user interaction.
 */
const app = {
  components: { UserStatus, ItemEditor },
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
