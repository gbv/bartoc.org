
const UserStatus = {
  template: `
  <span>
    {{connected}}
    <!-- this is shown in a <a> tag in the navbar -->
  </span>
  `,
  props: {
    auth: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      client: new LoginClient(this.auth, { ssl: true }),
      connected: false,
    }
  },
  created() {
    const { connect, disconnect, login, logout } = LoginClient.events
    this.client.addEventListener(connect, () => {
      this.connected = true
    })
    this.client.addEventListener(disconnect, () => {
      this.connected = false
    })
    this.client.addEventListener(null, console.log)
    this.client.connect()
  }
}

var script = {
  components: { UserStatus },
  data() {
    return {
      auth: "coli-conc.gbv.de/login/",
      user: {
        name: "JakobVoss"
      }
    }
  },
  created() {
  }
}

Vue.createApp(script).mount("#app")
