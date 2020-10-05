#!/bin/bash

SERVER=$1
BARTOC=`pwd`

[ -d $SERVER ] || exit 1

echo "Importing into jskos-server $SERVER. This resets all concept schemes and concepts!"

cd $SERVER
npm run -- import --reset schemes $BARTOC/cache/vocabularies.ndjson
npm run -- import schemes $BARTOC/data/bartoc-formats.scheme.ndjson
npm run -- import --reset concepts $BARTOC/data/bartoc-formats.concepts.ndjson
cd $BARTOC
