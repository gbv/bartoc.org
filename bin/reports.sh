#!/bin/bash

DUMP=data/dumps/latest.ndjson
[[ -f "$DUMP" ]] || exit

mkdir -p data/reports

report() {
  jq -c "select($1)|{uri,notation,prefLabel,modified}" $DUMP > "data/reports/$2.ndjson"
}

report '.extent|not' 'no-extent'
report '.license|not' 'no-license'
report '.definition|not' 'no-abstract'
report '.url|not' 'no-homepage'
report '.publisher|not' 'no-publisher'
report '.subject|not' 'no-subject'

#report '(.subject[]?.inScheme[]?.uri|select(.=="http://bartoc.org/en/node/241"))|not' 'no-subject-ddc'
#report '(.subject[]?.inScheme[]?.uri|select(.=="http://bartoc.org/en/node/15" or .=="http://eurovoc.europa.eu/100141"))|not' 'no-subject-eurovoc'
