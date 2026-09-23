import { fetchJson } from "../utils.js"
import { loadLanguageNames } from "./languages.js"

const WIKIDATA_ENTITY_PATTERN = /^http:\/\/www\.wikidata\.org\/entity\/Q[0-9]+$/
const WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

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
