export function withQuery(path, params) {
  const query = new URLSearchParams()

  // Build footer URLs with proper query escaping. Empty values are omitted,
  // while arrays stay repeatable, e.g. ?tag=a&tag=b.
  for (let [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") {
      continue
    }

    if (Array.isArray(value)) {
      value.forEach(entry => query.append(key, entry))
    } else {
      query.set(key, value)
    }
  }

  const queryString = query.toString()
  return queryString ? `${path}?${queryString}` : path
}
