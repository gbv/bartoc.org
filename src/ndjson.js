const { readFileSync } = require('fs')
module.exports = file => readFileSync(file)
  .toString().split(/\n|\n\r/).filter(Boolean).map(JSON.parse)
