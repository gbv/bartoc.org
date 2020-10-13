#!/bin/bash

SERVER=$1
BARTOC=`pwd`

[ -d $SERVER ] || exit 1

echo "Importing auxilary vocabularies into jskos-server $SERVER. This resets all concepts!"

cd $SERVER
npm run -- import schemes $BARTOC/data/bartoc-formats.scheme.ndjson
npm run -- import --reset concepts $BARTOC/data/bartoc-formats.concepts.ndjson
npm run -- import schemes $BARTOC/data/bartoc-access.scheme.ndjson
npm run -- import concepts $BARTOC/data/bartoc-access.concepts.ndjson
npm run -- import concepts $BARTOC/data/ddc100.concepts.ndjson
cd $BARTOC
