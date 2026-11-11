#!/bin/bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 JSKOS_SERVER_DIR BARTOC_VOCABULARIES_DIR" >&2
  exit 1
fi

server=$(cd "$1" && pwd -P)
vocabularies=$(cd "$2" && pwd -P)
names=(bartoc-formats bartoc-access ddc languages nkostype bartoc-api-types)

# Check every source file before writing anything to the database.
for name in "${names[@]}"; do
  for kind in scheme concepts; do
    file="$vocabularies/$name/$name-$kind.ndjson"
    if [ ! -f "$file" ]; then
      echo "Missing $file" >&2
      exit 1
    fi
  done
done

cd "$server"
for name in "${names[@]}"; do
  echo "Importing $name from bartoc-vocabularies..."
  npm run import -- schemes "$vocabularies/$name/$name-scheme.ndjson"
  npm run import -- --set-api concepts "$vocabularies/$name/$name-concepts.ndjson"
done
