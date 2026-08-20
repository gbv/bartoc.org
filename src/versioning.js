import { isBartocUri, normalizeUri } from "./uri.js"

/**
 * Fields that a terminology version may derive from its direct main record.
 *
 * This is intentionally an allowlist: every field not listed here remains
 * local to the stored version until a metadata-policy decision adds it. Each
 * listed field uses whole-field fallback, so any meaningful local value wins.
 */
export const DERIVED_VERSION_FIELDS = Object.freeze([
  "definition",
  "notation",
  "subject",
])

/**
 * Return the one valid direct inheritance source declared by a stored record.
 * Invalid, external, multiple, and self-referencing relations remain audit
 * diagnostics and must not accidentally activate inheritance.
 */
function directVersionTargetUri(item) {
  const references = item?.versionOf
  if (!Array.isArray(references) || references.length !== 1) {
    return null
  }

  const targetUri = normalizeUri(references[0]?.uri)
  const itemUri = normalizeUri(item?.uri)
  if (!isBartocUri(targetUri) || (itemUri && targetUri === itemUri)) {
    return null
  }
  return targetUri
}

/**
 * Return whether a stored value is meaningful enough to override inheritance.
 * Objects and arrays are inspected recursively because editor normalization can
 * leave structures such as `{ en: [" "] }` or `[{}]` behind.
 */
export function hasMeaningfulValue(value) {
  if (value === undefined || value === null) {
    return false
  }
  if (typeof value === "string") {
    return value.trim().length > 0
  }
  if (Array.isArray(value)) {
    return value.some(hasMeaningfulValue)
  }
  if (typeof value === "object") {
    return Object.values(value).some(hasMeaningfulValue)
  }
  // Numbers and booleans are stored values, including false and 0.
  return true
}

/**
 * Check whether a record declares exactly one valid direct BARTOC target.
 * The editor and derivation kernel share this definition.
 */
export function hasValidVersionOf(item) {
  return Boolean(directVersionTargetUri(item))
}

/**
 * Compute the role from a valid outgoing relation and incoming backlinks.
 * Invalid outgoing relations do not establish a version role; the separate
 * data-quality audit reports those records.
 */
export function recordKind(item, incomingVersions = []) {
  const hasOutgoingVersion = hasValidVersionOf(item)
  const hasIncomingVersions = Array.isArray(incomingVersions)
    ? incomingVersions.length > 0
    : incomingVersions === true

  if (hasOutgoingVersion && hasIncomingVersions) {
    return "mixed"
  }
  if (hasOutgoingVersion) {
    return "version"
  }
  if (hasIncomingVersions) {
    return "main"
  }
  return "standalone"
}

/**
 * Build a disposable effective copy using one-hop, whole-field fallback.
 * Both stored inputs remain independent from the returned object, including
 * nested values, so callers cannot materialize inheritance by mutation.
 */
export function deriveVersionRecord(
  version,
  main,
  fields = DERIVED_VERSION_FIELDS,
) {
  if (!version || typeof version !== "object" || Array.isArray(version)) {
    throw new TypeError("A stored version record is required.")
  }
  if (!Array.isArray(fields)) {
    throw new TypeError("Derived version fields must be an array.")
  }

  const effectiveItem = structuredClone(version)
  const derivedFields = {}
  const targetUri = directVersionTargetUri(version)
  const mainUri = normalizeUri(main?.uri)

  // An absent or mismatched target leaves the stored version fully usable.
  if (!targetUri || targetUri !== mainUri || typeof main !== "object" || Array.isArray(main)) {
    return { effectiveItem, derivedFields }
  }

  for (const field of new Set(fields)) {
    if (
      typeof field === "string" &&
      !hasMeaningfulValue(version[field]) &&
      hasMeaningfulValue(main[field])
    ) {
      effectiveItem[field] = structuredClone(main[field])
      derivedFields[field] = { from: mainUri }
    }
  }

  return { effectiveItem, derivedFields }
}
