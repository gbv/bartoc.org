This directory contains legacy data from the original BARTOC.org database until summer 2020.

* `eurovoc-select.html` contains the selection of EuroVoc identifiers used in BARTOC
* `location-select.html` contains the locations used in BARTOC
  * `locations.csv` contains location names and identifiers
* `rating.csv` contains ratings of vocabularies (see [this issue](https://github.com/gbv/bartoc.org/issues/1)) harvested with `rating.pl`

A snapshot of BARTOC.org vocabularies was taken in September 2020 via

    curl https://bartoc.org/en/export_vocabulary_nodes | jq -c .[] > vocabularies-dump.ndjson

Similar for vocabulary registries in `registries-dump.ndjson`.

Additional fields from data export were taken manually via <http://bartoc.org/en/download>

    jq -c '.[]|{Nid,Link,"Post date","Updated date"}' download.json > download-fields.ndjson

Before relaunch in October 2020 the Drupal export had to be transformed to JSKOS. See `Makefile` in this directory (transformation requires Perl >= 5.14 without additional modules).

States/regions of addresses were added later via (`regions.pl` in `regions.json`).
