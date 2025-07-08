#!/bin/bash
set -euo pipefail

fail() { echo "$@" >&2; exit 1; }

DUMP=${1:-data/dumps/latest.ndjson}
[[ -f "$DUMP" ]] || fail "Missing file: $DUMP"

mkdir -p data/reports

report() {
  report=data/reports/$2.json
  csv=data/reports/$2.csv
  jq "select($1)|{uri,prefLabel,modified,type:(.type[1:]|map(sub(\".+#\";\"\")))}" $DUMP | jq --arg name "$2" -s '{title:$name,schemes:.}' > $report
  jq -r '.schemes[]|[.uri,.prefLabel.en,(.type|join("|")),.modified]|@csv' $report > data/reports/$2.csv
}

report '.extent|not' 'no-extent'
report '.license|not' 'no-license'
report '.definition|not' 'no-abstract'
report '.url|not' 'no-homepage'
report '.publisher|not' 'no-publisher'
report '.subject|not' 'no-subject'
report '.type|length<2' 'no-type'
report '.FORMAT|not' 'no-format'
report '.languages|not' 'no-languages'

# TODO: find
#report '.subject[]?.inScheme[]?.uri=="http://bartoc.org/en/node/241"|not' 'no-ddc'

# TODO (does not work)
#report '(.subject[]?.inScheme[]?.uri|select(.=="http://bartoc.org/en/node/241"))|not' 'no-subject-ddc'
#report '(.subject[]?.inScheme[]?.uri|select(.=="http://bartoc.org/en/node/15" or .=="http://eurovoc.europa.eu/100141"))|not' 'no-subject-eurovoc'
