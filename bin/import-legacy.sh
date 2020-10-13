#!/bin/bash

SERVER=$1
BARTOC=`pwd`

[ -d $SERVER ] || exit 1

echo "Importing into jskos-server $SERVER. This resets all concept schemes!"

cd $SERVER
npm run -- import --reset schemes $BARTOC/cache/vocabularies.ndjson
cd $BARTOC
