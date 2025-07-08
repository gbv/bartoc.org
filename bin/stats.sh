#!/bin/bash
set -euo pipefail

fail() { echo "$@" >&2; exit 1; }

DUMP=${1:-data/dumps/latest.ndjson}
[[ -f "$DUMP" ]] || fail "Missing file: $DUMP"

histogram() {
  ABOUT=$1
  QUERY=$2
  echo "{ \"description\": \"number of $ABOUT\", \"histogram\": "
  jq -r "$QUERY" $DUMP | sort | uniq -c | \
    perl -nE 'say "{\"$2\": $1}" if $_ =~ /(\d+)\s+(.+)/' | jq . | jq -s add
  echo "}"
}

stat() {
  today=$(date -I)
  echo "{ \"date\": \"$(date -I)\" }"
  histogram 'vocabularies by type' \
            '.type[]'
  histogram 'vocabularies by license' \
            '.license[]?|.uri'
  histogram 'vocabularies by API type' \
            '.API|select(.)|map(.type)|unique|.[]'
  histogram 'vocabularies by country of publisher' \
            '.ADDRESS|select(.)|.country'
  histogram 'vocabularies by other registry they are listed in' \
            '.partOf|select(.)|.[].uri'
  histogram 'api endpoints by domain' \
            '.API[]?|.url|(split("/"))[:3]|join("/")'
  histogram 'vocabularies by language' \
            '.languages//[""]|.[]'
}

echo "Calculate statistics"
mkdir -p data/reports
stat | jq -s . > data/reports/stats.json
