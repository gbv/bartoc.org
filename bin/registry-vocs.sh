#!/usr/bin/bash

registries=./data/registries.ndjson

# Select registry APIs
filter=$(cat <<'JQ'
select(.API)|
.uri as $uri | .url as $url |
.API[] | {
  $uri,
  $url,
  type: (.type|split("/")[-1]),
  api: .url
}
JQ
)

jq -c "$filter" $registries | jq -r '[.uri,.url,.api,.type]|@tsv' | \
while IFS=$'\t' read -r uri url api type; do
  count=
  if [[ "$type" == "skosmos" ]]; then
    if [[ ! "$api" =~ rest/v1/ ]]; then
      api=${api}rest/v1/
    fi
    # count=$(curl -s "${api}vocabularies?lang=en" | jq '.vocabularies|length')
  elif [[ "$type" == "ols" ]]; then
    echo
    # count=$(curl -s "${api}/ontologies" | jq '.page.totalElements')
  elif [[ "$type" == "jskos" ]]; then
    #count=$(curl -s "${api}voc?limit=5000\&properties=uri" | jq length)
    echo
  elif [[ "$type" == "ontoportal" ]]; then
    echo "$type $url $api"
  elif [[ "$type" == "sparql" ]]; then
    # TODO
    echo
    #echo "$type $url $api"
  fi

  if [[ ! -z "$count" ]]; then
    echo "$type $url $count"
  fi
done

