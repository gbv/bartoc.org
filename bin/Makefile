../cache/vocabularies.ndjson: ../data/vocabularies-dump.ndjson vocabularies2jskos.pl
	./vocabularies2jskos.pl < $< > $@
	npm run validate -- -v scheme $(realpath $@)

../data/registries.ndjson: ../data/registries-dump.ndjson registries2jskos.pl
	./registries2jskos.pl < $< > $@
	npm run validate -- -u -v registry $(realpath $@)

