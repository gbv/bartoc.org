ols.schemes.ndjson: ols.ndjson
	jq -c -f ols2jskos.jq < $< > $@

ols.ndjson:
	./harvest.sh > ols.ndjson
