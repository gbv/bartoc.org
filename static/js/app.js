/**
 * If login server connected: show logged in user or link to login
 */
const UserStatus = {
  template: `
<a v-if="user" class="nav-link" :href="'https://' + auth">{{user.name}}</a>
<a v-else-if="connected" class="nav-link" :href="'https://' + auth + 'login'">login</a>`,
  props: {
    auth: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      client: new LoginClient(this.auth, { ssl: true }),
      connected: false,
      user: null
    }
  },
  emits: ['update:user'],
  created () {
    const { connect, disconnect, login, logout, update, error } = LoginClient.events
    this.client.addEventListener(connect, () => { this.connected = true })
    this.client.addEventListener(disconnect, () => { this.connected = false })
    this.client.addEventListener(login, ({ user }) => { this._updateUser(user) })
    this.client.addEventListener(update, ({ user }) => { this._updadeUser(user) })
    this.client.addEventListener(logout, () => { this._updateUser(null) })
    this.client.addEventListener(error, console.warn)
    this.client.connect()
  },
  methods: {
    _updateUser (user) {
      this.user = user
      this.$emit('update:user', user)
    }
  }
}

const FormRow = {
  template: `
    <div class="form-group row">
      <label :for="id" class="col-form-label col-sm-2">{{label}}</label>
      <div class="col-sm-10">
        <slot/>
      </div>
    </div>`,
  props: ["id", "label"]
}

/**
 * Web form to modify and create vocabulary metadata.
 */
const ItemEditor = {
  components: { FormRow },
  template: `
<p>
  {{item}}
  <form>
    <form-row :id="'title'" :label="'Title'">
      <input type="text" id="title" v-model="item.prefLabel.en"/>
    </form-row>
    <form-row :id="'languages'" :label="'Languages'">
      <input type="text" id="languages" v-model="item.languages"/>
    </form-row>
    <form-row :id="'startDate'" :label="'Created'">
      <input type="text" v-model="item.startDate"/>
    </form-row>
    <div class="form-group row">
      <div class="col-sm-2"></div>
      <div class="col-sm-10">
        <button class="btn btn-primary" @click="saveItem">Save</button>
        &nbsp;
        <!--button class="btn btn-warning">Reset</button-->
      </div>
    </div>
  </form>
</p>
<p>Vocabularies are editable by <a href="/contact">the BARTOC.org editors</a>.</p>
`,
  props: {
    backend: {
      type: String
    },
    user: {
      type: Object
    },
    current: {
      type: Object
    }
  },
  data () {
    const item = this.currentItem || {}
    item.prefLabel = item.prefLabel || {}

    // TODO: use cdk instead. Catch error.
    fetch("https://api.dante.gbv.de/voc/top?uri=http%3A%2F%2Furi.gbv.de%2Fterminology%2Flicense%2F").then(res => res.json())
    .then(res => { this.licenses = res } )

    return {
      item,
      kostypes: null,
      licenses: null
    }
  },
  methods: {
    saveItem () {
      console.log('saveItem')
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
      auth: 'coli-conc.gbv.de/login/',
      user: null
    }
  },
  methods: {
    updateUser (user) {
      this.user = user
    }
  }
}

Vue.createApp(app).mount('#app')
