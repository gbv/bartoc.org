# convert OLS JSON format to JSKOS
# fields not used in the current data (e.g. skos and creator) are ignored.
# config.annotation further contains several inconstistenly used fields

(
  [ (.config.annotations.license // []) | .[] | select(.[0:4]=="http") ] 
  | map({ uri: . })
) as $license |

.config.id as $id |

($id|split(".")|.[-1] == "owl") as $owl | 

{
  prefLabel: {
    en: .config.title
  },
  notation: [
   .config.preferredPrefix,
   .ontologyId
  ] | unique,
  definition: {
    en: [ .config.description ]
  },
  extent: ( # TODO omit zero values 
   (.numberOfTerms|tostring) + " terms, " +
   (.numberOfProperties|tostring) + " properties, " +
   (.numberOfIndividuals|tostring) + " individuals" +
   " (" + .updated[0:7] + ")"
  ),
  identifier: [ $id ],

  # All vocabularies in OJS are freely available
  ACCESS: [ { uri: "http://bartoc.org/en/Access/Free" } ],

  license: $license,

  FORMAT: [
    { uri: "http://bartoc.org/en/Format/Online" },
    (select($owl) | { uri: "http://bartoc.org/en/Format/OWL" }) 
  ],

  # All vocabularies in OLS are listed in OLS
  partOf: [ { uri: "http://bartoc.org/en/node/17808" } ],

  # All vocabularies in OLS are ontologies
  type: [
    "http://www.w3.org/2004/02/skos/core#ConceptScheme",
    "http://w3id.org/nkos/nkostype#ontology"
  ]
}
+ (if .homepage then { url: .homepage } else {} end)
