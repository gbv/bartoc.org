export const CONCEPT_SCHEME_TYPE = "http://www.w3.org/2004/02/skos/core#ConceptScheme"

/**
 * Get the KOS types without the required SKOS ConceptScheme type.
 */
export function kosTypeUris(item) {
  return Array.isArray(item?.type)
    ? item.type.filter(type => type !== CONCEPT_SCHEME_TYPE)
    : []
}
