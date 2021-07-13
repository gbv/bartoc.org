#!/bin/bash

DUMP=data/dumps/latest.ndjson
[[ -f "$DUMP" ]] || exit

histogram() {
  echo -n '"histogram": '
  sort | uniq -c | awk '{printf "{\"%s\": %d}", $2, $1}' | jq . | jq -s add
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
}

echo "Calculate statistics"
mkdir -p data/reports
stat | jq -s . > data/reports/stats.json
