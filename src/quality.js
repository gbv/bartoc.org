// Each rule has a report name, a message, a JSON Pointer, and a test.
// The test is true when the record needs a warning.
// These rules come from the old shell reports.
const qualityChecks = [
  { id: "no-extent", message: "Missing extent", pointer: "/extent", fails: item => !item.extent },
  { id: "no-license", message: "Missing license", pointer: "/license", fails: item => !item.license },
  { id: "no-abstract", message: "Missing abstract", pointer: "/definition", fails: item => !item.definition },
  { id: "no-homepage", message: "Missing homepage", pointer: "/url", fails: item => !item.url },
  { id: "no-publisher", message: "Missing publisher", pointer: "/publisher", fails: item => !item.publisher },
  { id: "no-subject", message: "Missing subject", pointer: "/subject", fails: item => !item.subject },
  { id: "no-kos-type", message: "Missing KOS type", pointer: "/type", fails: item => (item.type?.length ?? 0) < 2 },
  { id: "no-format", message: "Missing format", pointer: "/FORMAT", fails: item => !item.FORMAT },
  { id: "no-languages", message: "Missing languages", pointer: "/languages", fails: item => !item.languages },
  { id: "api-but-no-examples", message: "API provided without notation examples", pointer: "/notationExamples", fails: item => Boolean(item.API) && !item.notationExamples },
]

/** Return one warning when a record fails the named check. */
export function qualityWarning(item, id) {
  const rule = qualityChecks.find(rule => rule.id === id)
  if (rule?.fails(item)) {
    return makeWarning(rule)
  }
}

/** Return all quality warnings for one vocabulary record. */
export function qualityWarnings(item = {}) {
  return qualityChecks
    .filter(rule => rule.fails(item))
    .map(makeWarning)
}

/** Return the names used for the JSON and CSV report files. */
export function qualityReportNames() {
  return qualityChecks.map(rule => rule.id)
}

/** Build a DVRF warning from a failed quality rule. */
function makeWarning({ id, message, pointer }) {
  return {
    types: [id],
    level: "warning",
    message,
    position: { jsonpointer: pointer },
  }
}
