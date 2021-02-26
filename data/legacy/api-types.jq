# Migrate API values from plain URL strings to typed values (#87)
# Usage:
#   jq -c -f latest.ndjson > latest-with-api-types.ndjson

def apitype:
  if (.|test("bartoc|dante|bielefeld|coli-conc")) then
    "http://bartoc.org/api-type/jskos"
  elif (.|test("skosmos")) then
    "http://bartoc.org/api-type/skosmos"
  else
    "http://bartoc.org/api-type/webservice"
  end
;

if .API then
  .API=(.API|map({ url: ., type: (.|apitype) }))
else . end
