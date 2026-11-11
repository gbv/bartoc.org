const mimeTypeLabels = {
  "application/x-ndjson": "NDJSON",
  "application/json": "JSON",
  "application/ld+json": "JSON-LD",
  "application/rdf+xml": "RDF/XML",
  "text/turtle": "Turtle",
  "application/n-triples": "N-Triples",
}

const formatLabels = {
  "http://format.gbv.de/jskos": "JSKOS",
}

/**
 * Return a readable label for a JSKOS download distribution.
 * Prefer explicit metadata over information inferred from the URL.
 */
export function downloadLabel(distribution) {
  const url = distribution?.download
  if (!url) {
    return ""
  }

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return url
  }

  const mimetype = distribution.mimetype
    ?.split(";")[0]
    .trim()
    .toLowerCase()

  const mediaLabel = mimetype
    ? mimeTypeLabels[mimetype] || mimetype
    : ""

  const formatLabel = formatLabels[distribution.format] || ""

  const fallback = parsed.searchParams.get("download")?.toUpperCase()
    || parsed.pathname.split("/").pop()

  const detail = formatLabel && mediaLabel
    ? `${formatLabel} (${mediaLabel})`
    : formatLabel || mediaLabel || fallback

  return detail
    ? `${parsed.host} · ${detail}`
    : parsed.host
}
