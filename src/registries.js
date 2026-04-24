import utils from "./utils.js"
import config from "../config/index.js"
const rootDir = new URL("../", import.meta.url).pathname

// Registry records with this type are also full terminology repositories or services
export const repoType = "http://bartoc.org/full-repository"

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
    return { registries, repositories }
  } catch (error) {
    config.warn("Could not load registries from bartoc api. Using local file.", error)

    const registries = loadRegistriesFromFile()
    const repositories = getRepositories(registries)

    config.log(
      `Read ${Object.keys(registries).length} registries from local file, ` +
      `${Object.keys(repositories).length} also being repositories or services.`,
    )
    return { registries, repositories }
  }

}
