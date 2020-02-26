../cache/vocabularies.ndjson: ../data/vocabularies-dump.ndjson vocabularies2jskos.pl
	./vocabularies2jskos.pl < $< > $@
	jskos-validate -v scheme $@
