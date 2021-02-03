
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

## Transform and import legacy data

Before relaunch in October 2020 the Drupal export from September 2020 had to be transformed and (requires Perl >= 5.14 without additional modules):

~~~sh
npm run data
~~~

Then import the resulting file `cache/vocabularies.ndjson` and additional vocabulary files into your jskos-server instance (resetting all stored vocabularies and concepts!):

~~~
./bin/import-legacy.sh $DIRECTORY_OF_YOUR_JSKOS_SERVER
~~~


