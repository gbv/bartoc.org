// TODO: configure somewhere else, this is part of BARTOC data anyway
export const indexingSchemes = [
  {
    uri: "http://bartoc.org/en/node/241",
    namespace: "http://dewey.info/class/",
    notation: ["DDC"],
  },
  {
    uri: "http://bartoc.org/en/node/15",
    namespace: "http://eurovoc.europa.eu/",
    prefLabel: { en: "EuroVoc" },
  },
  {
    uri: "http://bartoc.org/de/node/472",
    namespace: "http://bartoc.org/en/ILC/",
    notation: ["ILC"],
  },
]

// TODO: use cdk instead
export function loadConcepts(api, uri) {
  if (uri) api = `${api}?uri=${encodeURIComponent(uri)}`
  return fetch(api).then(res => res ? res.json() : [])
}
