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

const ItemEditor = {
  template: `
<p>
  {{item}}
  <form>
    <div class="form-group row">
      <label for="type" class="col-form-label col-sm-2">Title</label>
      <div class="col-sm-10">
        <input type="text" id="title"/>
      </div>
    </div>
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
    return {
      item: this.currentItem
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
