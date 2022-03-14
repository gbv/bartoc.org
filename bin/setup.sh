#!/bin/bash

function ask {
  read -r -p "$1"
  if [[ $REPLY =~ ^[Yy]e?s?$ ]]
  then
    return 1
  else
    return 0
  fi
}

SERVER=$1
BARTOC=`pwd`

if [ -z $SERVER ]; then
  echo "Please provide the path to your jskos-server installation as first argument."
  exit 1
fi

echo "Setup using jskos-server installation in $SERVER..."
echo

cd $SERVER

# Flush existing
ask "Do you want to flush all existing data (schemes, concepts) from the database? (y/N) "
if [ $? -eq 1 ]; then
  npm run reset -- -t concepts
  npm run reset -- -t schemes
  echo
fi

# Create indexes
ask "Do you want to create database indexes (required for first setup)? (y/N) "
if [ $? -eq 1 ]; then
  npm run import -- --indexes
  echo
fi

# Import auxiliary vocabularies and concepts
echo "Importing auxiliary vocabularies and concepts..."

npm run import -- schemes $BARTOC/data/bartoc-formats.scheme.ndjson
npm run import -- concepts $BARTOC/data/bartoc-formats.concepts.ndjson

npm run import -- schemes $BARTOC/data/bartoc-access.scheme.ndjson
npm run import -- concepts $BARTOC/data/bartoc-access.concepts.ndjson

npm run import -- schemes $BARTOC/data/ddc.scheme.ndjson
npm run import -- concepts $BARTOC/data/ddc100.concepts.ndjson

npm run import -- schemes $BARTOC/data/languages.scheme.ndjson
npm run import -- concepts $BARTOC/data/languages.concepts.ndjson

npm run import -- schemes $BARTOC/data/nkostype.scheme.ndjson
npm run import -- concepts $BARTOC/data/nkostype.concepts.ndjson

npm run import -- schemes $BARTOC/data/bartoc-api-types.scheme.ndjson
npm run import -- concepts $BARTOC/data/bartoc-api-types.concepts.ndjson


npm run import -- schemes $BARTOC/data/eurovoc.scheme.ndjson
npm run import -- schemes $BARTOC/data/ilc.scheme.ndjson

# Import latest dump
ask "Do you want to import the latest BARTOC dump? (y/N) "
if [ $? -eq 1 ]; then
  npm run import -- schemes https://bartoc.org/api/voc?limit=10000
  echo
fi

cd $BARTOC
