import { fetchJson, readSessionJson, writeSessionJson } from "../utils.js"

const WIKIDATA_ENTITY_PATTERN = /^http:\/\/www\.wikidata\.org\/entity\/Q[0-9]+$/
const WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
const LANGUAGE_VOCABULARY_URI = "http://bartoc.org/en/node/20287"
// Keep API request URLs short.
const LANGUAGE_BATCH_SIZE = 50
// This cache lasts for the current browser tab.
const LANGUAGE_NAME_CACHE_KEY = "bartoc.wikipedia.languageNames"

// Return English names for the given language codes.
// Use cached names first and request only missing codes from BARTOC.
async function loadLanguageNames(languageCodes) {
  // Use a session cache to avoid repeated requests for the same language codes.
  const languageNames = readSessionJson(LANGUAGE_NAME_CACHE_KEY)

  // Missing codes are those not yet cached or previously failed to load.
  const missingCodes = [...new Set(languageCodes)]
    .filter(code => languageNames[code] === undefined)

  for (let start = 0; start < missingCodes.length; start += LANGUAGE_BATCH_SIZE) {
    const codeBatch = missingCodes.slice(start, start + LANGUAGE_BATCH_SIZE)
    const languageApiUrl = new URL("/api/concepts", window.location.origin)
    languageApiUrl.searchParams.set(
      "uri",
      codeBatch.map(code => `https://bartoc.org/language/${code}`).join("|"),
    )
    languageApiUrl.searchParams.set("voc", LANGUAGE_VOCABULARY_URI)

    const languageConcepts = await fetchJson(languageApiUrl)
    // Retry failed batches on a later page.
    if (!Array.isArray(languageConcepts)) {
      continue
    }

    for (const languageConcept of languageConcepts) {
      const languageName = languageConcept.prefLabel?.en?.trim()
      for (const code of languageConcept.notation || []) {
        languageNames[code] = languageName || null
      }
    }
    // Cache unknown codes from successful batches.
    for (const code of codeBatch) {
      if (languageNames[code] === undefined) {
        languageNames[code] = null
      }
    }
    writeSessionJson(LANGUAGE_NAME_CACHE_KEY, languageNames)
  }

  return languageNames
}

// Load Wikipedia links for the first valid Wikidata identifier.
// Return an empty list when no identifier or Wikipedia data is available.
export async function loadWikipediaLinks(terminologyIdentifiers = []) {
  // Only accept Wikidata entity URIs used by BARTOC.
  const wikidataEntityUri = terminologyIdentifiers.find(
    identifier => WIKIDATA_ENTITY_PATTERN.test(identifier),
  )
  if (!wikidataEntityUri) {
    return []
  }

  // Only load Wikipedia pages and sort them by language.
  const wikipediaQuery = `
    PREFIX schema: <http://schema.org/>
    PREFIX wikibase: <http://wikiba.se/ontology#>
    SELECT ?url ?language WHERE {
      ?url schema:about <${wikidataEntityUri}>;
        schema:inLanguage ?language;
        schema:isPartOf ?project.
      ?project wikibase:wikiGroup "wikipedia".
    }
    ORDER BY ?language
  `
  const wikidataRequestUrl = new URL(WIKIDATA_SPARQL_ENDPOINT)
  wikidataRequestUrl.searchParams.set("query", wikipediaQuery)
  wikidataRequestUrl.searchParams.set("format", "json")

  const wikidataResult = await fetchJson(
    wikidataRequestUrl,
    "application/sparql-results+json",
  )
  if (!wikidataResult) {
    return []
  }

  const wikipediaPages = wikidataResult.results?.bindings || []
  const languageNames = await loadLanguageNames(
    wikipediaPages.map(wikipediaPage => wikipediaPage.language.value),
  )
  return wikipediaPages.map(wikipediaPage => {
    const url = wikipediaPage.url.value
    const languageCode = wikipediaPage.language.value
    const languageName = languageNames[languageCode] || languageCode
    return { url, languageName }
  })
}
