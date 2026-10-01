// Each rule has a report name, a message, a JSON Pointer, and a test.
// The test is true when the record needs a warning.
// Each ID is a file name without its extension. Add a clear title and description.

export const qualityChecks = [
  { id: "no-extent",
    message: "Missing extent",
    description: "Records without an extent or size.",
    jsonpointer: "/extent", fails: item => !item.extent },
  { id: "no-license",
    message: "Missing license",
    description: "Records without a license.",
    jsonpointer: "/license", fails: item => !item.license },
  { id: "no-abstract", description: "Records without an abstract.",
    message: "Missing abstract", jsonpointer: "/definition", fails: item => !item.definition },
  { id: "no-homepage",
    description: "Records without a website URL.",
    message: "Missing homepage", jsonpointer: "/url", fails: item => !item.url },
  { id: "no-publisher",
    description: "Records without a publisher.",
    message: "Missing publisher", jsonpointer: "/publisher", fails: item => !item.publisher },
  { id: "no-subject",
    description: "Records without a subject classification.",
    message: "Missing subject", jsonpointer: "/subject", fails: item => !item.subject },
  { id: "no-kos-type",
    description: "Records without a specific knowledge organization system type.",
    message: "Missing KOS type", jsonpointer: "/type", fails: item => (item.type?.length ?? 0) < 2 },
  { id: "no-format",
    message: "Missing format", jsonpointer: "/FORMAT", fails: item => !item.FORMAT },
  { id: "no-languages",
    description: "Records without listed content languages.",
    message: "Missing languages", jsonpointer: "/languages", fails: item => !item.languages },
  { id: "api-but-no-examples",
    description: "API endpoints with no notation examples.",
    message: "API provided without notation examples", jsonpointer: "/notationExamples", fails: item => Boolean(item.API) && !item.notationExamples },
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

/** Build a DVRF warning from a failed quality rule. */
function makeWarning({ id, message, jsonpointer }) {
  return {
    types: [id],
    level: "warning",
    message,
    position: { jsonpointer },
  }
}
