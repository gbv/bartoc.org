.PHONY: languages.concepts.json

# collect/convert auxiliary vocabularies

default: bartoc-formats.concepts.ndjson ddc100.concepts.ndjson languages.concepts.ndjson nkostype.concepts.ndjson bartoc-api-types.concepts.ndjson k10plus-ikt.json

bartoc-formats.concepts.ndjson: formats.csv bartoc-formats.scheme.ndjson
	npm run jskos-convert -- -f csv -t ndjson -m -l en -s bartoc-formats.scheme.ndjson $< > $@

ddc100.concepts.ndjson: ddc100.csv
	npm run jskos-convert -- -s ddc.scheme.ndjson concepts $< > $@

languages.concepts.ndjson:
	curl -L --silent https://datahub.io/core/language-codes/r/language-codes-full.json \
	| jq -cf languages.jq > $@

nkostype.concepts.ndjson:
	curl -L --silent http://api.dante.gbv.de/voc/nkostype/top \
  | jq -c '.[]|.topConceptOf=.inScheme' > $@

bartoc-api-types.concepts.ndjson: bartoc-api-types.concepts.csv
	npm run jskos-convert -- -m -v -s bartoc-api-types.scheme.ndjson $< > $@

k10plus-ikt.json:
	curl -s https://opac.k10plus.de/DB=2.299/XML=1.0/IKTLIST \
    | perl -n -E '/mnemonic="([^"]+)[^>]+>(\d+)/ and say "{\"$$1\":$$2}"' \
    | jq -s add > $@
