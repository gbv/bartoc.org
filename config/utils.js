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
