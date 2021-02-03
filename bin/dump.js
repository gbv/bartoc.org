const config = require("../config")
const fs = require("fs")
const path = require("path")
const cdk = require("cocoda-sdk")
const _ = require("lodash")
const diff = require("jsondiffpatch")
const LineReader = require("n-readlines")

const dumpsDir = path.join(__dirname, "../data/dumps")
const [command, ...args] = process.argv.slice(2)

if (command === "diff" || command === "jsonpatch") {
  const formatter = command === "diff" ? diff.console.log
    : delta => console.log(JSON.stringify(diff.formatters.jsonpatch.format(delta)))

  if (args.length === 2) {
    dumpDiff(...args, formatter)
  } else if (args.length === 1) {
    dumpDiff(args[0], `${dumpsDir}/latest.ndjson`, formatter)
  } else {
    usage("diff $file1 [$file2]")
  }
} else if (command === "update") {
  updateDump()
} else {
  usage("[diff|jsonpatch|update] [arguments]")
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
      const keys = Object.keys(item).filter(key => key[0] !== "_").sort()
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
    provider: "ConceptApi",
    api: `http://localhost:${config.port}/api/`,
  })

  backend.getSchemes({ params: { limit: 9999 } }).then(schemes => {
    const latest = `${dumpsDir}/latest.ndjson`
    if (fs.existsSync(latest)) {
      const mtime = fs.statSync(latest).mtime.toISOString().split("T")[0]
      fs.renameSync(latest, `${dumpsDir}/${mtime}.ndjson`)
    }

    const stream = fs.createWriteStream(latest)
    _.sortBy(schemes, "uri").forEach(voc => {
      stream.write(JSON.stringify(normalize(voc)) + "\n")
    })
    console.log(`${latest}: ${schemes.length} vocabularies`)
  })
}

function dumpDiff (fileA, fileB, showDelta) {
  const a = new LineReader(fileA)
  const b = new LineReader(fileB)

  const next = reader => {
    const line = reader.next()
    if (line) return normalize(JSON.parse(line))
  }

  const addedDelta = item => {
    for (const key in item) { item[key] = [item[key]] }
    return item
  }

  const removedDelta = item => ({ uri: [item.uri, 0, 0] })

  var before = next(a)
  var after = next(b)

  while (before && after) { // eslint-disable-line

    while (after && after.uri < before.uri) {
      showDelta(addedDelta(after))
      after = next(b)
    }

    if (after) {
      while (before && before.uri < after.uri) {
        showDelta(removedDelta(before))
        before = next(a)
      }

      if (before && before.uri === after.uri) {
        const delta = diff.diff(before, after)
        if (delta) {
          delta.uri = [before.uri] // always show uri as added
          showDelta(delta)
        }
        before = next(a)
        after = next(b)
      }
    }
  }

  var item
  while (before = next(a)) { // eslint-disable-line
    showDelta(removedDelta(before))
  }

  while (item = next(b)) { // eslint-disable-line
    showDelta(addedDelta(item))
  }
}
