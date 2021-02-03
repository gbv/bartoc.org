This directory contains auxiliary vocabularies and data from the original BARTOC.org database until summer 2020.

## Local identifiers

* DDC (`ddc-ids.csv`)
* EuroVoc (`eurovoc-ids.csv`)
* Languages (`language-ids.csv`)
* Formats (`formats.csv`)

## EuroVoc

* `data/eurovoc-select.html` contains the selection of EuroVoc identifiers used in BARTOC

## Locations

* `data/location-select.html` contains the locations used in BARTOC

## Snapshot of BARTOC.org vocabularies

Taken in September 2020 via

    curl https://bartoc.org/en/export_vocabulary_nodes | jq -c .[] > vocabularies-dump.ndjson

Additional fields from data export taken manually via <http://bartoc.org/en/download>

    jq -c '.[]|{Nid,Link,"Post date","Updated date"}' download.json > download-fields.ndjson
