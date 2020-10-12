const config = require('../config')
const fs = require('fs')
const path = require('path')
const cdk = require('cocoda-sdk')
const _ = require('lodash')
const diff = require('jsondiffpatch')
const LineReader = require('n-readlines')

const dumpsDir = path.join(__dirname, '../data/dumps')
const [command, ...args] = process.argv.slice(2)

if (command === 'diff') {
  if (args.length === 2) {
    dumpDiff(...args, diff.console.log)
  } else if (args.length === 1) {
    dumpDiff(args[0], `${dumpsDir}/latest.ndjson`, diff.console.log)
  } else {
    usage('diff $file1 [$file2]')
  }
} else if (command === 'update') {
  updateDump()
} else {
  usage('[diff|update] [arguments]')
}

function usage (syntax) {
  console.log(`Usage: dump ${syntax}`)
  process.exit()
}

function normalize (item) {
  return _.cloneDeepWith(item, value => {
    // apply Unicode normalization to strings
    if (_.isString(value)) return value.normalize()
    // sort keys and remove keys starting with "_"
    if (_.isPlainObject(item)) {
      const keys = Object.keys(item).filter(key => key[0] !== '_').sort()
      return keys.reduce((obj, key) => {
        obj[key] = normalize(item[key])
        return obj
      }, {})
    }
  })
}

function updateDump () {
  if (!fs.existsSync(dumpsDir)) fs.mkdirSync(dumpsDir)

  const backend = cdk.initializeRegistry({
    provider: 'ConceptApi',
    api: `http://localhost:${config.port}/api/`
  })

  backend.getSchemes({ params: { limit: 9999 } }).then(schemes => {
    const latest = `${dumpsDir}/latest.ndjson`
    if (fs.existsSync(latest)) {
      const mtime = fs.statSync(latest).mtime.toISOString().split('T')[0]
      fs.renameSync(latest, `${dumpsDir}/${mtime}.ndjson`)
    }

    const stream = fs.createWriteStream(latest)
    _.sortBy(schemes, 'uri').forEach(voc => {
      stream.write(JSON.stringify(normalize(voc)) + '\n')
    })
    console.log(`${latest}: ${schemes.length} vocabularies`)
  })
}

function dumpDiff (fileA, fileB, showDelta) {
  const a = new LineReader(fileA)
  const b = new LineReader(fileB)

  let line
  while (line = a.next()) { // eslint-disable-line
    var other = b.next()
    var delta

    if (other) {
      line = line.toString()
      other = other.toString()
      if (line !== other) {
        const before = JSON.parse(line)
        const after = JSON.parse(other)

        delta = diff.diff(before, after)
        delta.uri = [before.uri] // always show uri as added
      }
    } else {
      // removed
      const uri = JSON.parse(line).uri
      delta = { uri: [uri, 0, 0] }
    }

    if (delta) {
      showDelta(delta)
    }
  }

  while (line = b.next()) { // eslint-disable-line
    // added
    const delta = JSON.parse(line)
    for (const key in delta) { delta[key] = [delta[key]] }
    showDelta(delta)
  }
}
