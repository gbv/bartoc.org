import utils from "./utils.js"
import config from "../config/index.js"
const rootDir = new URL("../", import.meta.url).pathname

// Registry records with this type are also full terminology repositories or services
export const repoType = "http://bartoc.org/full-repository"

export function registriesApiUrl() {
  const params = new URLSearchParams({ limit: "10000" })
  return `/api/registries?${params}`
}

export function jskosDataUrl(uri) {
  const params = new URLSearchParams({ uri })
  return `/api/data?${params}`
}

// read registries from the local NDJSON file.
export function loadRegistriesFromFile() {
  return utils.indexByUri(utils.readNdjson(rootDir, "./data/registries.ndjson"))
}

// Build the subset of registries that are also repositories/services.
export function getRepositories(registries) {
  return utils.indexByUri(
    Object.values(registries).filter(item =>
      item.type?.find(type => type === repoType),
    ),
  )
}

// Primary loader: read registries from jskos-server.
export async function loadRegistriesFromBackend() {
  const url = utils.backendUrl("registries")
  config.log(`Loading registries from backend at ${url}...`)
  // Request all registries. Without an explicit limit, jskos-server returns only
  // the default page size.
  url.searchParams.set("limit", "10000")

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Could not load registries from ${url}`)
  }

  const items = await res.json()
  return utils.indexByUri(items)
}

// Refresh registries from bartoc api.
// If the backend is not available or the import has not been run yet,
// keep using the local file as fallback.
export async function refreshRegistries() {
  try {
    const registries = await loadRegistriesFromBackend()
    const repositories = getRepositories(registries)

    config.log(
      `Read ${Object.keys(registries).length} registries from bartoc api, ` +
      `${Object.keys(repositories).length} also being repositories or services.`,
    )
    return { registries, repositories, source: "backend" }
  } catch (error) {
    config.warn("Could not load registries from bartoc api. Using local file.", error)

    const registries = loadRegistriesFromFile()
    const repositories = getRepositories(registries)

    config.log(
      `Read ${Object.keys(registries).length} registries from local file, ` +
      `${Object.keys(repositories).length} also being repositories or services.`,
    )
    return { registries, repositories, source: "file" }
  }

}

export function addTerminologiesCounts(registries, counts) {
  // Keep counts on the registry records passed to the Vue component.
  for (const registry of Object.values(registries)) {
    if (Number.isInteger(counts[registry.uri])) {
      registry.terminologiesCount = counts[registry.uri]
    }
  }

  return registries
}

// Load only one terminology. The backend still returns the full count.
async function registryTerminologiesCount(registry) {
  const schemes = await config.registry.getSchemes({
    params: { partOf: registry.uri, limit: 1 },
  })

  return schemes._totalCount ?? 0
}

// Count terminologies outside the main registry refresh path.
export async function registriesTerminologiesCount(registries, { concurrency = 5 } = {}) {
  const counts = {}
  const items = Object.values(registries)
  const batchSize = Math.max(1, concurrency)

  // Load counts in small batches so we do not flood the backend.
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize)

    await Promise.all(batch.map(async registry => {
      try {
        counts[registry.uri] = await registryTerminologiesCount(registry)
      } catch (error) {
        config.warn(`Could not load schemes count for registry ${registry.uri}`, error)
      }
    }))
  }

  config.log(`Read terminology counts for ${Object.keys(counts).length} registries.`)

  return counts
}

// Add counts after the page can already use the basic registry list.
export async function enrichRegistriesWithTerminologiesCounts(registries, options) {
  const counts = await registriesTerminologiesCount(registries, options)
  return addTerminologiesCounts(registries, counts)
}
