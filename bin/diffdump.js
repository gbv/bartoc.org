const diff = require('jsondiffpatch')
const LineReader = require('n-readlines')

const args = process.argv.slice(2)
if (args.length !== 2) {
  console.log('Usage: diffdump $file1 $file2')
  process.exit()
}

const showDelta = diff.console.log

const a = new LineReader(args[0])
const b = new LineReader(args[1])

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
