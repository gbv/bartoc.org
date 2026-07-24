export function validateSparqlEndpoint(endpoint) {
  const invalidConfiguration = () => new TypeError(
    "Invalid \"sparql\" configuration: expected an absolute HTTP(S) URL or null",
  )

  if (endpoint === null) {
    return null
  }

  if (typeof endpoint !== "string" || !endpoint.trim()) {
    throw invalidConfiguration()
  }

  let url
  try {
    url = new URL(endpoint.trim())
  } catch {
    throw invalidConfiguration()
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw invalidConfiguration()
  }

  return url.href
}

export function normalizeSparqlExamples(examples) {
  const invalidConfiguration = () => new TypeError(
    "Invalid \"sparqlExamples\" configuration: expected an array of objects with non-empty \"label\" and \"query\" strings",
  )

  if (!Array.isArray(examples)) {
    throw invalidConfiguration()
  }

  return examples.map(example => {
    if (
      !example ||
      Array.isArray(example) ||
      typeof example !== "object" ||
      typeof example.label !== "string" ||
      !example.label.trim() ||
      typeof example.query !== "string" ||
      !example.query.trim()
    ) {
      throw invalidConfiguration()
    }

    return {
      label: example.label.trim(),
      query: example.query.trim(),
    }
  })
}
