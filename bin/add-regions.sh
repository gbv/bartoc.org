#!/bin/bash

jq -c '{key:.uri,value:.ADDRESS.region}|select(.value)' ../cache/vocabularies.ndjson | jq -s from_entries > regions.json

cat ../data/dumps/2021-01-28.ndjson | perl -E '
use JSON::PP;

my $regions = do { local ( @ARGV, $/ ) = "regions.json"; decode_json(<>) };

while (<>) {
    my $item = decode_json $_;
    if ( $item->{ADDRESS} && !$item->{ADDRESS}{region} ) {
        my $region = $regions->{ $item->{uri} };
        $item->{ADDRESS}{region} = $region if $region;
    }
    say encode_json $item;
}
' > ../data/dumps/2021-01-28-with-regions.ndjson
