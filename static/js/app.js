/**
 * Establish connection to login server and show logged in user or link to login.
 */
const UserStatus = {
  template: `
<a v-if="user" class="nav-link" :href="'https://' + login">{{user.name}}</a>
<a v-else-if="connected" class="nav-link" :href="'https://' + login + 'login'">login</a>`,
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
    const { connect, disconnect, login, logout, update, error, publicKey, token, about } = LoginClient.events
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
      <label :for="id" class="col-form-label col-sm-2">{{label}}</label>
      <div class="col-sm-10">
        <slot/>
      </div>
    </div>`,
  props: ['id', 'label']
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
 * Edit prefLabel (first of each language) and alternativeLabel.
 */
const LabelEditor = {
  components: { LanguageSelect },
  template: `<table>
    <tr v-for="(label,i) in labels">
      <td>
        <input type="text" class="form-control" v-model="label.label"/>
      </td>
      <td>
        <language-select v-model="label.language"/>
        <button type="button" class="btn btn-outline-primary btn-sm" @click="remove(i)">x</button>
      </td>
    </tr>
    <tr>
      <td>
        <button type="button" class="btn btn-outline-primary btn-sm" @click="add">+</button>
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
      this.add(this.prefLabel[language], language)
    }
    // this will move an altLabel to become a prefLabel when no prefLabel of its language exist!
    for (const language in this.altLabel) {
      this.altLabel[language].forEach(label => this.add(label, language))
    }
    this.add()
    this.$watch('labels', this.change, { deep: true })
  },
  methods: {
    add (label = '', language = '') {
      this.labels.push({ label, language })
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
 * Web form to modify and create vocabulary metadata.
 */
const ItemEditor = {
  components: { FormRow, LabelEditor, LanguageSelect },
  template: `
<p>
    <form-row :id="'title'" :label="'URI'" v-if="item.uri">
      <a :href="item.uri">{{item.uri}}</a>
    </form-row>
    <form-row :id="'title'" :label="'Title'">
      <label-editor v-model:prefLabel="item.prefLabel" v-model:altLabel="item.altLabel"/>
    </form-row>
    <form-row :id="'languages'" :label="'Languages'">
      <language-select v-model="item.languages" class="form-control" :repeatable="true"/>
    </form-row>
    <form-row :id="'startDate'" :label="'Created'">
      <input type="text" class="form-control" v-model="item.startDate"/>
    </form-row>
    <form-row :id="'extent'" :label="'Extent'">
      <input type="text" class="form-control" v-model="item.extent"/>
    </form-row>
    <form-row :id="'license'" :label="'License'">
      <select v-model="item.license" multiple :size="(licenses||[]).length" class="form-control">
        <option v-for="l in licenses" v-bind:value="l.uri">{{prefLabel(l)}}</option>
      </select>
    </form-row>
    <form-row :id="'abstract-en'" :label="'English Abstract'">
      <textarea id="abstract-en" class="form-control" v-model="item.definition.en"></textarea>
    </form-row>
    <form-row :id="'abstract'" :label="'Non-English Abstract'">
      <textarea id="abstract" class="form-control" v-model="item.definition.und"></textarea>
      <!-- TODO: select language of abstract -->
    </form-row>
    <form-row :label="'KOS Types'">
      ...
    </form-row>
    <form-row :label="'Subjects'">
      ...DDC Main Class, DDC, EuroVoc, ILC...
    </form-row>
    <form-row :label="'Formats'">
      ...
    </form-row>
    <form-row :label="'Access'">
      ...
    </form-row>
    <form-row :label="'Wikidata'">
      ...
    </form-row>
    <form-row :label="'Links'">
      ...
    </form-row>
    <form-row :label="'Publisher'">
      ...author, address, location, VIAF
    </form-row>
    <form-row :label="'Contact'">
      ...
    </form-row>
    <form-row :label="'Listed In'">
      ...
    </form-row>
    <form-row :label="'Vocabulary services'">
      ...
    </form-row>
    <div class="form-group row">
      <div class="col-sm-2"></div>
      <div class="col-sm-10">
        <button v-if="auth" class="btn btn-primary" @click="saveItem">Save</button>
	<span v-else>authentification required</span>
      </div>
    </div>
</p>
<button @click="displayJSON=!displayJSON">{{displayJSON ? 'hide JSON' : 'show JSON'}}</button>
<pre v-show="displayJSON">{{item}}</pre>
<p>Vocabularies are editable by <a href="/contact">the BARTOC.org editors</a>.</p>
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
    item.prefLabel = item.prefLabel || {}
    item.altLabel = item.altLabel || {}
    item.definition = item.definition || {}
    item.license = item.license || []

    // make non-English abstract to language code "und"
    const code = Object.keys(item.definition).find(code => code !== 'en')
    if (code) {
      item.definition.und = item.definition[code]
      delete item.definition[code]
    }

    // TODO: use cdk instead. Catch error.
    fetch('https://api.dante.gbv.de/voc/top?uri=http%3A%2F%2Furi.gbv.de%2Fterminology%2Flicense%2F').then(res => res.json())
      .then(res => { this.licenses = res })
    // TODO: also load kostypes

    return {
      item,
      kostypes: null,
      licenses: null,
      displayJSON: false
    }
  },
  methods: {
    prefLabel (item) {
      if (item && item.prefLabel) {
        if ('en' in item.prefLabel) return item.prefLabel.en
        for (const lang in item.prefLabel) return item.prefLabel[lang]
      }
      return '???'
    },
    saveItem () {
      if (!this.user || !this.auth) return
      const api = '/api/voc'
      const method = this.item.uri ? 'PUT' : 'POST'
      const body = JSON.stringify(this.item)
      const token = this.auth.token
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      fetch('/api/voc', { method, body, headers }).then(res => {
        console.log(res)
      })
      // status 422: invalid JSKOS?
      // TODO: catch error and show message
    }
  }
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
