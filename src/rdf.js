import jsonld from "jsonld"
import $rdf from "rdflib"
import util from "util"
import { canonicalItemCopy } from "./itemSerialization.js"

// to load local JSON files
import { createRequire } from "module"
const require = createRequire(import.meta.url)

const jskosContext = require("../static/context.json")

const parseRDF = util.promisify($rdf.parse)

export const rdfContentType = {
  nt: "application/n-triples",
  ntriples: "application/n-triples",
  json: "application/json",
  jsonld: "application/json",
  // Omit turtle serialization because it seems broken (missing subject URI)
  // turtle: "text/turtle",
  //ttl: "text/turtle",
  rdfxml: "application/rdf+xml",
  xml: "application/rdf+xml",
}

export function rdfResponseContentType(format, inline = false) {
  const type = rdfContentType[format]

  // Firefox downloads N-Triples by MIME type. Footer previews may expose the
  // same serialization as plain text without changing the canonical endpoint.
  return inline && type === "application/n-triples" ? "text/plain" : type
}

export const rdfNamespaces = {
  dct: "http://purl.org/dc/terms/",
  foaf: "http://xmlns.com/foaf/0.1/",
  nkostype: "http://w3id.org/nkos/nkostype#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  skos: "http://www.w3.org/2004/02/skos/core#",
  viaf: "http://viaf.org/viaf/",
  void: "http://rdfs.org/ns/void#",
  xskos: "http://rdf-vocabulary.ddialliance.org/xkos#",
}

// serialize JSKOS item in RDF
export async function rdfSerialize(item, format) {
  const type = rdfContentType[format]
  if (!type) {
    throw new Error(`RDF serialization format ${format} not supported!`)
  }

  const document = canonicalItemCopy(item, jskosContext)

  // jsonld library only supports NTriples serialization
  if (type === "application/n-triples") {
    return jsonld.toRDF(document, { format: "application/n-quads" })
  }

  // serialize, parse, serialize
  const store = $rdf.graph()
  const doc = $rdf.sym(document.uri)

  await parseRDF(JSON.stringify(document), store, doc.uri, "application/ld+json")

  store.namespaces = rdfNamespaces
  // JSON-LD parsing stores statements in a named graph. Passing no graph here
  // serializes the complete store instead of returning an empty RDF/XML file.
  return $rdf.serialize(null, store, null, type)
}
