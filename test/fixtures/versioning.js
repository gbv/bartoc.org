const CONCEPT_SCHEME_TYPE = "http://www.w3.org/2004/02/skos/core#ConceptScheme"
const THESAURUS_TYPE = "http://w3id.org/nkos/nkostype#thesaurus"

export const THE_SOZ_MAIN_URI = "http://bartoc.org/en/node/21133"
export const THE_SOZ_2004_URI = "http://bartoc.org/en/node/294"
export const THE_SOZ_2009_URI = "http://bartoc.org/en/node/20827"

/**
 * Recursively freeze shared fixtures so a test cannot accidentally alter the
 * input of a later table-driven case. Versioning tests should clone a fixture
 * explicitly when they need mutable data.
 */
function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value
  }

  Object.values(value).forEach(deepFreeze)
  return Object.freeze(value)
}

/**
 * Reduced TheSoz fixtures preserve only metadata relevant to the MVP rules.
 * Their compact marker text is deliberate: these are contract fixtures, not
 * snapshots that should drift whenever the development backend changes.
 */
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
  subject: [{
    uri: "subject:social-sciences",
    prefLabel: { en: "Social sciences" },
  }],
  type: [CONCEPT_SCHEME_TYPE, THESAURUS_TYPE],
})

export const storedTheSoz2004 = deepFreeze({
  uri: THE_SOZ_2004_URI,
  prefLabel: { en: "Thesaurus for the Social Sciences" },
  versionOf: [{ uri: THE_SOZ_MAIN_URI }],
  definition: { und: ["This version is outdated."] },
  startDate: "2004",
  API: [{ type: "jskos", url: "https://example.org/thesoz/2004/api" }],
})

export const storedTheSoz2009 = deepFreeze({
  uri: THE_SOZ_2009_URI,
  prefLabel: { en: "Thesaurus for the Social Sciences" },
  versionOf: [{ uri: THE_SOZ_MAIN_URI }],
  definition: {
    en: ["Version-specific English description."],
    de: ["Versionsspezifische deutsche Beschreibung."],
  },
  // Equal values are still explicit stored overrides, not derived values.
  notation: ["TheSoz"],
  subject: [{
    uri: "subject:social-sciences",
    prefLabel: { en: "Social sciences" },
  }],
  startDate: "2009",
  extent: "Approximately 12,000 concepts",
  identifier: ["https://doi.org/10.0000/example"],
  namespace: "https://data.example.org/thesoz/",
})

const storedMinimalVersion = deepFreeze({
  uri: "http://bartoc.org/en/node/99901",
  prefLabel: { en: "Minimal TheSoz version" },
  versionOf: [{ uri: THE_SOZ_MAIN_URI }],
  startDate: "2026",
})

const storedEmptyScaffoldingVersion = deepFreeze({
  uri: "http://bartoc.org/en/node/99902",
  prefLabel: { en: "Version with empty editor scaffolding" },
  versionOf: [{ uri: THE_SOZ_MAIN_URI }],
  definition: { en: ["  "] },
  notation: [],
  subject: [{}],
})

const storedChainedVersion = deepFreeze({
  uri: "http://bartoc.org/en/node/99903",
  prefLabel: { en: "Version pointing to another version" },
  versionOf: [{ uri: THE_SOZ_2004_URI }],
})

const storedOtherMain = deepFreeze({
  uri: "http://bartoc.org/en/node/99904",
  prefLabel: { en: "Unrelated terminology" },
  definition: { en: ["Must not be inherited by the TheSoz version."] },
})

/**
 * These samples are deliberately not a denylist. They document that fields
 * outside DERIVED_VERSION_FIELDS remain local by default, including future or
 * currently unclassified fields.
 */
export const localByDefaultMainFields = deepFreeze({
  type: [CONCEPT_SCHEME_TYPE, THESAURUS_TYPE],
  identifier: ["MAIN-ID"],
  languages: ["en", "de"],
  extent: "12,000 concepts",
  license: [{ uri: "https://example.org/license" }],
  url: "https://example.org/terminology",
  startDate: "1960",
  endDate: "2026",
  version: "2026.1",
  FORMAT: [{ uri: "http://bartoc.org/en/Format/SKOS" }],
  ACCESS: [{ uri: "http://bartoc.org/en/Access/Free" }],
  API: [{ type: "jskos", url: "https://example.org/api" }],
  distributions: [{ download: "https://example.org/download" }],
  services: [{ endpoint: "https://example.org/service" }],
  namespace: "https://example.org/concepts/",
  uriPattern: "https://example.org/concepts/{notation}",
  publisher: [{ uri: "https://example.org/publisher" }],
  ADDRESS: { locality: "Berlin" },
  CONTACT: { email: "contact@example.org" },
  partOf: [{ uri: "http://bartoc.org/en/node/1" }],
  basedOn: [{ uri: "http://bartoc.org/en/node/2" }],
  created: "2026-01-01",
  issued: "2026-01-02",
  modified: "2026-01-03",
  creator: [{ uri: "https://example.org/creator" }],
  contributor: [{ uri: "https://example.org/contributor" }],
  altLabel: { en: ["Alternative label"] },
  subjectOf: [{ url: "https://example.org/documentation" }],
  notationPattern: "[A-Z]+",
  notationExamples: ["ABC"],
  DISPLAY: { notation: true },
  futureUnclassifiedField: "must remain local",
})

const localByDefaultMain = deepFreeze({
  uri: "http://bartoc.org/en/node/99905",
  prefLabel: { en: "Main with local-only metadata" },
  ...localByDefaultMainFields,
})

const localByDefaultVersion = deepFreeze({
  uri: "http://bartoc.org/en/node/99906",
  prefLabel: { en: "Version without local-only metadata" },
  versionOf: [{ uri: localByDefaultMain.uri }],
})

/**
 * Expected outputs are stored beside their inputs to freeze the contract
 * independently from the derivation kernel. Slice 3 runs this same table
 * against deriveVersionRecord while the contract checks keep the fixtures
 * coherent with the allowlist and persistence boundaries.
 */
export const derivationContractCases = deepFreeze([
  {
    name: "derives every missing allowlisted field",
    version: storedMinimalVersion,
    main: storedTheSozMain,
    expected: {
      effectiveItem: {
        ...storedMinimalVersion,
        definition: storedTheSozMain.definition,
        notation: storedTheSozMain.notation,
        subject: storedTheSozMain.subject,
      },
      derivedFields: {
        definition: { from: THE_SOZ_MAIN_URI },
        notation: { from: THE_SOZ_MAIN_URI },
        subject: { from: THE_SOZ_MAIN_URI },
      },
    },
  },
  {
    name: "treats any stored definition map as a whole-field override",
    version: storedTheSoz2004,
    main: storedTheSozMain,
    expected: {
      effectiveItem: {
        ...storedTheSoz2004,
        notation: storedTheSozMain.notation,
        subject: storedTheSozMain.subject,
      },
      derivedFields: {
        notation: { from: THE_SOZ_MAIN_URI },
        subject: { from: THE_SOZ_MAIN_URI },
      },
    },
  },
  {
    name: "keeps explicit fields even when they equal the main values",
    version: storedTheSoz2009,
    main: storedTheSozMain,
    expected: {
      effectiveItem: storedTheSoz2009,
      derivedFields: {},
    },
  },
  {
    name: "treats normalized empty editor scaffolding as missing",
    version: storedEmptyScaffoldingVersion,
    main: storedTheSozMain,
    expected: {
      effectiveItem: {
        ...storedEmptyScaffoldingVersion,
        definition: storedTheSozMain.definition,
        notation: storedTheSozMain.notation,
        subject: storedTheSozMain.subject,
      },
      derivedFields: {
        definition: { from: THE_SOZ_MAIN_URI },
        notation: { from: THE_SOZ_MAIN_URI },
        subject: { from: THE_SOZ_MAIN_URI },
      },
    },
  },
  {
    name: "leaves the stored version usable when the target is unavailable",
    version: storedMinimalVersion,
    main: null,
    expected: {
      effectiveItem: storedMinimalVersion,
      derivedFields: {},
    },
  },
  {
    name: "rejects a loaded target that does not match versionOf",
    version: storedMinimalVersion,
    main: storedOtherMain,
    expected: {
      effectiveItem: storedMinimalVersion,
      derivedFields: {},
    },
  },
  {
    name: "derives only from the direct target without following its versionOf",
    version: storedChainedVersion,
    main: storedTheSoz2004,
    expected: {
      effectiveItem: {
        ...storedChainedVersion,
        definition: storedTheSoz2004.definition,
      },
      derivedFields: {
        definition: { from: THE_SOZ_2004_URI },
      },
    },
  },
  {
    name: "does not derive fields outside the allowlist",
    version: localByDefaultVersion,
    main: localByDefaultMain,
    expected: {
      effectiveItem: localByDefaultVersion,
      derivedFields: {},
    },
  },
])

/**
 * Shared missing-value examples keep editor cleanup and derivation semantics
 * aligned. false and 0 are meaningful even though they are falsy in JavaScript.
 */
export const meaningfulValueContractCases = deepFreeze([
  { name: "undefined", value: undefined, expected: false },
  { name: "null", value: null, expected: false },
  { name: "whitespace string", value: "  \n", expected: false },
  { name: "empty array", value: [], expected: false },
  { name: "empty object", value: {}, expected: false },
  { name: "nested empty array", value: { en: [] }, expected: false },
  { name: "nested whitespace", value: { en: ["  "] }, expected: false },
  { name: "array of empty values", value: [null, " "], expected: false },
  { name: "false", value: false, expected: true },
  { name: "zero", value: 0, expected: true },
  { name: "non-empty string", value: "value", expected: true },
  { name: "nested value", value: { en: ["value"] }, expected: true },
])

/**
 * Record kind needs incoming-relation information: an item alone cannot
 * distinguish a standalone record from a main record.
 */
export const recordKindContractCases = deepFreeze([
  {
    name: "standalone record",
    item: { uri: "http://bartoc.org/en/node/99910" },
    incomingVersions: [],
    expected: "standalone",
  },
  {
    name: "main record",
    item: { uri: THE_SOZ_MAIN_URI },
    incomingVersions: [{ uri: THE_SOZ_2004_URI }],
    expected: "main",
  },
  {
    name: "version record",
    item: storedTheSoz2004,
    incomingVersions: [],
    expected: "version",
  },
  {
    name: "unsupported mixed role",
    item: storedTheSoz2004,
    incomingVersions: [{ uri: "http://bartoc.org/en/node/99911" }],
    expected: "mixed",
  },
])
