const CONCEPT_SCHEME_TYPE = "http://www.w3.org/2004/02/skos/core#ConceptScheme"
const THESAURUS_TYPE = "http://w3id.org/nkos/nkostype#thesaurus"
const ONTOLOGY_TYPE = "http://w3id.org/nkos/nkostype#ontology"

export const THE_SOZ_MAIN_URI = "http://bartoc.org/en/node/21133"
export const THE_SOZ_2004_URI = "http://bartoc.org/en/node/294"
export const THE_SOZ_2009_URI = "http://bartoc.org/en/node/20827"

// Keep shared test records unchanged.
function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value
  }

  Object.values(value).forEach(deepFreeze)
  return Object.freeze(value)
}

// Small TheSoz records used by the version tests.
export const storedTheSozMain = deepFreeze({
  uri: THE_SOZ_MAIN_URI,
  prefLabel: {
    en: "Thesaurus for the Social Sciences",
    de: "Thesaurus Sozialwissenschaften",
  },
  definition: {
    en: ["General English description."],
    de: ["Allgemeine deutsche Beschreibung."],
  },
  notation: ["TheSoz"],
  languages: ["gsw", "eo"],
  notationExamples: ["A100", "B200"],
  subject: [{
    uri: "subject:social-sciences",
    prefLabel: { en: "Social sciences" },
  }],
  type: [CONCEPT_SCHEME_TYPE, THESAURUS_TYPE],
})

export const storedTheSoz2004 = deepFreeze({
  uri: THE_SOZ_2004_URI,
  type: [CONCEPT_SCHEME_TYPE],
  version: "3.0",
  versionOf: [{ uri: THE_SOZ_MAIN_URI }],
  definition: { und: ["This version is outdated."] },
  startDate: "2004",
})

export const storedTheSoz2009 = deepFreeze({
  uri: THE_SOZ_2009_URI,
  type: [CONCEPT_SCHEME_TYPE, ONTOLOGY_TYPE],
  prefLabel: { en: "New Thesaurus for the Social Sciences" },
  version: "4.0",
  versionOf: [{ uri: THE_SOZ_MAIN_URI }],
  definition: { en: ["Version-specific description."] },
  notation: ["TheSoz"],
  languages: ["it", "eo"],
  notationExamples: ["V4-100"],
  subject: [{
    uri: "subject:social-sciences",
    prefLabel: { en: "Social sciences" },
  }],
  startDate: "2009",
  extent: "Approximately 12,000 concepts",
})
