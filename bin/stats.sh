#!/bin/bash

DUMP=data/dumps/latest.ndjson
[[ -f "$DUMP" ]] || exit

histogram() {
  echo -n '"histogram": '
  sort | uniq -c | perl -nE 'say "{\"$2\": $1}" if $_ =~ /(\d+)\s+(.+)/' | jq . | jq -s add
}

stat() {
  echo '{'
  echo '  "description": "number of vocabularies by type",'
  jq -r '.type[]' $DUMP | histogram
  echo '}'

  echo '{'
  echo '  "description": "number of vocabularies by API type",'
  jq -r '.API|select(.)|map(.type)|unique|.[]' $DUMP | histogram
  echo "}"

  echo '{'
  echo '  "description": "number of vocabularies by country of publisher",'
  jq -r '.ADDRESS|select(.)|.country' $DUMP | histogram
  echo "}"

  echo '{'
  echo '  "description": "number of vocabularies by other registry they are listed in",'
  jq -r '.partOf|select(.)|.[].uri' $DUMP | histogram
  echo "}"

}

echo "Calculate statistics"
mkdir -p data/reports
stat | jq -s . > data/reports/stats.json
