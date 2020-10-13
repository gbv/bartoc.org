default: bartoc-formats.concepts.ndjson ddc100.concepts.ndjson

bartoc-formats.concepts.ndjson: formats.csv bartoc-formats.scheme.ndjson
	jskos-convert -f csv -t ndjson -m -l en -s bartoc-formats.scheme.ndjson $< > $@

ddc100.concepts.ndjson: ddc100.csv
	jq 'select(.uri=="http://bartoc.org/en/node/241")+{uriPattern:"http://dewey.info/class/(.+)/e23/"}' ../cache/vocabularies.ndjson > tmp.json
	jskos-convert -s tmp.json concepts $< > $@
