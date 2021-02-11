vocabularies.ndjson: vocabularies-dump.ndjson vocabularies2jskos.pl
	./vocabularies2jskos.pl download-fields.ndjson < $< > $@
	npm run validate -- -v scheme $(realpath $@)

../registries.ndjson: registries-dump.ndjson registries2jskos.pl
	./registries2jskos.pl < $< > $@
	npm run validate -- -u -v registry $(realpath $@)

