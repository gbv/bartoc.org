Local identifiers used in BARTOC.org until 2019:

* DDC (`ddc-ids.csv`)
* EuroVoc (`eurovoc-ids.csv`)
* Languages (`language-ids.csv`)
* Formats (`formats.csv`)

Snapshot of BARTOC.org vocabularies, taken in early 2020 via

    curl https://bartoc.org/en/export_vocabulary_nodes | jq -c .[] > vocabulary-dump.ndjson

