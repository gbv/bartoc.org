const BARTOC_RECORD_URI = /^http:\/\/bartoc\.org\/en\/node\/[1-9][0-9]+$/

/**
 * Normalize user-entered relation URIs without coercing other value types.
 */
export function normalizeUri(value) {
  return typeof value === "string" ? value.trim() : ""
}

/**
 * Identify canonical BARTOC record URIs. Call normalizeUri first when input
 * comes from an editable field where surrounding whitespace is permitted.
 */
export function isBartocUri(value) {
  return typeof value === "string" && BARTOC_RECORD_URI.test(value)
}
