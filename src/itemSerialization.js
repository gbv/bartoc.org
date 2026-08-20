/**
 * Create a canonical serialization copy without computed presentation fields.
 * Serializers may add their own JSON-LD context without mutating stored data.
 */
export function canonicalItemCopy(item, context) {
  const copy = structuredClone(item)
  for (const key of Object.keys(copy)) {
    if (key.startsWith("_")) {
      delete copy[key]
    }
  }
  if (context !== undefined) {
    copy["@context"] = context
  }
  return copy
}
