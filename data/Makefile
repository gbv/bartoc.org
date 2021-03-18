.PHONY: languages.concepts.json

# collect/convert auxiliary vocabularies

default: bartoc-formats.concepts.ndjson ddc100.concepts.ndjson languages.concepts.ndjson nkostype.concepts.ndjson bartoc-api-types.concepts.ndjson

bartoc-formats.concepts.ndjson: formats.csv bartoc-formats.scheme.ndjson
	jskos-convert -f csv -t ndjson -m -l en -s bartoc-formats.scheme.ndjson $< > $@

ddc100.concepts.ndjson: ddc100.csv
	jskos-convert -s ddc.scheme.ndjson concepts $< > $@

languages.concepts.ndjson:
	curl -L --silent https://datahub.io/core/language-codes/r/language-codes-full.json \
	| jq -cf languages.jq > $@

nkostype.concepts.ndjson:
	curl -L --silent http://api.dante.gbv.de/voc/nkostype/top \
  | jq -c '.[]|.topConceptOf=.inScheme' > $@

bartoc-api-types.concepts.ndjson: bartoc-api-types.concepts.csv
	jskos-convert -m -v -s bartoc-api-types.scheme.ndjson $< > $@
