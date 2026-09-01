import { isBartocUri, normalizeUri } from "./uri.js"

/**
 * Fields that a version may take from its main record.
 *
 * The version title follows a separate rule. All other fields stay on the
 * version record.
 */
export const DERIVED_VERSION_FIELDS = Object.freeze([
  "definition",
  "notation",
  "subject",
])

/**
 * Get the main record URI from `versionOf`.
 *
 * The link is accepted only when there is one BARTOC URI and it does not point
 * back to the same record.
 */
function directVersionTargetUri(item) {
  const references = item?.versionOf

  // A version must point to exactly one main record.
  if (!Array.isArray(references) || references.length !== 1) {
    return null
  }

  // Clean both URIs before comparing them.
  const targetUri = normalizeUri(references[0]?.uri)
  const itemUri = normalizeUri(item?.uri)

  // Ignore links outside BARTOC and links back to the same record.
  if (!isBartocUri(targetUri) || (itemUri && targetUri === itemUri)) {
    return null
  }

  return targetUri
}

/**
 * Check whether a value contains useful saved data.
 *
 * Empty strings, arrays, and objects do not count as values.
 */
export function hasMeaningfulValue(value) {
  // Missing values are empty.
  if (value === undefined || value === null) {
    return false
  }

  // A string with only spaces is empty.
  if (typeof value === "string") {
    return value.trim().length > 0
  }

  // An array has a value when at least one item has a value.
  if (Array.isArray(value)) {
    return value.some(hasMeaningfulValue)
  }

  // An object has a value when at least one of its fields has a value.
  if (typeof value === "object") {
    return Object.values(value).some(hasMeaningfulValue)
  }

  // Values such as false and 0 still count.
  return true
}

/**
 * Get the version number without spaces at the start or end.
 *
 * Keep the number as text. Values such as "3.0 beta" are valid.
 */
export function versionNumber(item) {
  return typeof item?.version === "string" ? item.version.trim() : ""
}

/**
 * Choose the title shown for a terminology version.
 *
 * Use the version's own title when it has one. Otherwise add the version number
 * to each title from the matching main record. The saved records are not
 * changed.
 */
export function deriveVersionPrefLabel(versionRecord, mainRecord) {
  const localPrefLabel = versionRecord?.prefLabel

  // First use the version's own title.
  if (hasMeaningfulValue(localPrefLabel)) {
    return {
      // Keep the returned title separate from the saved version record.
      prefLabel: structuredClone(localPrefLabel),
      derived: false,
    }
  }

  // Read the values needed to build a title from the main record.
  const number = versionNumber(versionRecord)
  const mainUri = normalizeUri(mainRecord?.uri)
  const mainLabels = mainRecord?.prefLabel

  // A new title needs a version number and the right main record.
  if (
    !number ||
    !mainUri ||
    directVersionTargetUri(versionRecord) !== mainUri ||
    !mainLabels ||
    typeof mainLabels !== "object" ||
    Array.isArray(mainLabels)
  ) {
    return { prefLabel: undefined, derived: false }
  }

  // Build one version title for each available language.
  const prefLabel = {}
  for (const [language, label] of Object.entries(mainLabels)) {
    // Skip missing and empty titles.
    if (typeof label === "string" && label.trim()) {
      prefLabel[language] = `${label.trim()} ${number}`
    }
  }

  // Return no title when the main record has no usable title.
  return hasMeaningfulValue(prefLabel)
    ? { prefLabel, derived: true, from: mainUri }
    : { prefLabel: undefined, derived: false }
}

/**
 * Check whether a record has one valid `versionOf` link.
 */
export function hasValidVersionOf(item) {
  return Boolean(directVersionTargetUri(item))
}

/**
 * Tell whether a record is a main record, a version, both, or neither.
 */
export function versionRole(item, incomingVersions = []) {
  // A version points to a main record.
  const hasOutgoingVersion = hasValidVersionOf(item)

  // A main record has at least one version pointing to it.
  const hasIncomingVersions = Array.isArray(incomingVersions)
    ? incomingVersions.length > 0
    : incomingVersions === true

  // A version can also have versions of its own.
  if (hasOutgoingVersion && hasIncomingVersions) {
    return "mixed"
  }

  // This record only points to a main record.
  if (hasOutgoingVersion) {
    return "version"
  }

  // This record only has versions pointing to it.
  if (hasIncomingVersions) {
    return "main"
  }

  // This record has no version links in either direction.
  return "standalone"
}

/**
 * Build the version record used on the page.
 *
 * Start with a copy of the version. Missing allowed fields may come from the
 * matching main record. The saved records are not changed.
 */
export function deriveVersionRecord(
  version,
  main,
  fields = DERIVED_VERSION_FIELDS,
) {
  // A version record is always required.
  if (!version || typeof version !== "object" || Array.isArray(version)) {
    throw new TypeError("A stored version record is required.")
  }

  // The fields to check must be a list.
  if (!Array.isArray(fields)) {
    throw new TypeError("Derived version fields must be an array.")
  }

  // Start with the version's own data.
  const effectiveItem = structuredClone(version)

  // Remember which fields come from the main record.
  const derivedFields = {}

  // Check that the version points to the given main record.
  const targetUri = directVersionTargetUri(version)
  const mainUri = normalizeUri(main?.uri)

  // If the records do not match, show the version as it is.
  if (!targetUri || targetUri !== mainUri || typeof main !== "object" || Array.isArray(main)) {
    return { effectiveItem, derivedFields }
  }

  // Use a title from the main record only when the version has no title.
  const title = deriveVersionPrefLabel(version, main)
  if (title.derived) {
    effectiveItem.prefLabel = title.prefLabel
    derivedFields.prefLabel = { from: title.from }
  }

  // Check every allowed field once.
  for (const field of new Set(fields)) {
    // Keep the version's value. Use the main value only when it is missing.
    if (
      typeof field === "string" &&
      !hasMeaningfulValue(version[field]) &&
      hasMeaningfulValue(main[field])
    ) {
      // Copy the value into the record shown on the page.
      effectiveItem[field] = structuredClone(main[field])

      // Remember where the value came from.
      derivedFields[field] = { from: mainUri }
    }
  }

  return { effectiveItem, derivedFields }
}
