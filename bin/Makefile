../cache/vocabularies.ndjson: ../data/vocabularies-dump.ndjson vocabularies2jskos.pl
	./vocabularies2jskos.pl < $< > $@
	npm run validate -- -v scheme $(realpath $@)
