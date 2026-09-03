const WIKIDATA_ENTITY_PATTERN = /^http:\/\/www\.wikidata\.org\/entity\/Q[0-9]+$/
const WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

export async function loadWikipediaLinks(identifiers = []) {
  // Use only full Wikidata entity URIs in the format stored by BARTOC.
  const wikidataUri = identifiers.find(value => WIKIDATA_ENTITY_PATTERN.test(value))
  if (!wikidataUri) {
    return []
  }

  // The old drupal query returned sitelinks from every Wikimedia project.
  // Limit results to Wikipedia and sort them for a stable display.
  const query = `
    PREFIX schema: <http://schema.org/>
    PREFIX wikibase: <http://wikiba.se/ontology#>
    SELECT ?url ?language WHERE {
      ?url schema:about <${wikidataUri}>;
        schema:inLanguage ?language;
        schema:isPartOf ?project.
      ?project wikibase:wikiGroup "wikipedia".
    }
    ORDER BY ?language
  `
  const endpoint = new URL(WIKIDATA_SPARQL_ENDPOINT)
  endpoint.searchParams.set("query", query)
  endpoint.searchParams.set("format", "json")

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/sparql-results+json" },
    })
    if (!response.ok) {
      return []
    }

    const sitelinks = (await response.json()).results?.bindings || []
    return sitelinks.map(sitelink => ({
      url: sitelink.url.value,
      language: sitelink.language.value,
    }))
  } catch {
    // Wikipedia links are optional. Keep the page usable if the request fails.
    return []
  }
}
