const _ = require("lodash")

// Load default config
const configDefault = require("./config.default.json")
// Current environment
const env = process.env.NODE_ENV || "development"
// Load environment config
let configEnv
try {
  configEnv = require(`./config.${env}.json`)
} catch(error) {
  configEnv = {}
}
// Load user config
let configUser
try {
  // Don't load user config for test environment
  if (env == "test") {
    throw new Error()
  }
  configUser = require("./config.json")
} catch(error) {
  configUser = {}
}

let config = _.defaultsDeep({ env }, configEnv, configUser, configDefault)

// Logging functions
config.log = (...args) => {
  if (env != "test" && config.verbosity) {
    console.log(...args)
  }
}
config.warn = (...args) => {
  if (env != "test" && config.verbosity) {
    console.warn(...args)
  }
}
config.error = (...args) => {
  if (env != "test" && config.verbosity) {
    console.error(...args)
  }
}

// Set baseUrl to localhost if not set
if (!config.baseUrl) {
  config.baseUrl = `http://localhost:${config.port}/`
}
if (!config.baseUrl.endsWith("/")) {
  config.baseUrl += "/"
}

module.exports = config
