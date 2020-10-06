---
title: Download
---

The content of BARTOC is available in several formats under the [Public Domain Dedication and License](http://www.opendatacommons.org/licenses/pddl/1.0/) (Public Domain).

## Linked Open Data

Each entry is identifier by an URI of the form `http://bartoc.org/en/node/{ID}` where `{ID}` is a number.
For instance the International Classification of Diseases (ICD) has URI [http://bartoc.org/en/node/447](/en/node/447) (mind it starts with `http://`, not `https://`).
Each BARTOC entry can be accessed in RDF N-Triples format by appending
`?format=nt` to its URI. The footer contains a corresponding "RDF" link.

## JSKOS format

Each BARTOC entry can be accessed in [JSKOS format](https://gbv.github.io/jskos/) by appending
`?format=json` to its URI. The footer contains a corresponding "JSON" link.

## API

BARTOC can be accessed at [https://bartoc.org/api/](/api/) via JSKOS API to query and filter vocabulary metadata.

## Database dumps

Regular database dumps [will be made available](https://github.com/gbv/bartoc.org/issues/4) later. Meanwhile use JSKOS API `/voc?limit=5000` to download all records in JSKOS format.
