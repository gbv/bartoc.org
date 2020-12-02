#!/bin/bash

# TODO: this will only work for up to 500 ontologies

API=http://www.ebi.ac.uk/ols/api/ontologies
SIZE=20
COUNT=$(curl -s -L "$API?size=500" | jq .page.totalElements)

PAGES=$((COUNT / SIZE))
for page in `seq 0 $PAGES`
do 
    curl -s -L "$API?page=$page&size=$SIZE" | jq -Sc '._embedded.ontologies|.[]'
done

