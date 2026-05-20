export const CONCEPT_LOOKUP_BATCH_SIZE = 20

export async function getConceptsInBatches(backend, concepts, batchSize = CONCEPT_LOOKUP_BATCH_SIZE) {
  const list = Array.isArray(concepts) ? concepts : []
  const size = Math.max(1, batchSize)
  const found = []

  for (let offset = 0; offset < list.length; offset += size) {
    const batch = list.slice(offset, offset + size)
    found.push(...await backend.getConcepts({ concepts: batch }))
  }

  return found
}
