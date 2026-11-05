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

SERVER=${1:-}
BARTOC=$(pwd -P)
VOCABULARIES=${2:-../bartoc-vocabularies}

if [ -z "$SERVER" ]; then
  echo "Please provide the path to your jskos-server installation as first argument."
  exit 1
fi

SERVER=$(cd "$SERVER" && pwd -P)
VOCABULARIES=$(cd "$VOCABULARIES" && pwd -P)

echo "Setup using jskos-server installation in $SERVER..."
echo

cd "$SERVER"

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

# Import auxiliary vocabularies from their source of truth.
"$BARTOC/bin/import-vocabularies.sh" "$SERVER" "$VOCABULARIES" || exit 1

npm run import -- schemes $BARTOC/data/eurovoc.scheme.ndjson -n
npm run import -- schemes $BARTOC/data/ilc.scheme.ndjson -n

# Import/replace registries from file (current source of truth)
yes | npm run reset -- -t registry
npm run import -- registry $BARTOC/data/registries.ndjson

# Import latest dump
ask "Do you want to import the latest BARTOC dump? (y/N) "
if [ $? -eq 1 ]; then
  npm run import -- schemes https://bartoc.org/api/voc?limit=10000
  echo
fi

cd $BARTOC
