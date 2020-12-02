#!/usr/bin/env perl
use v5.14;
use HTTP::Tiny;
use JSON::PP;
use URI::Escape;

my $http = HTTP::Tiny->new;

sub find {
    my $query = shift;
    my $res   = $http->get(
        "https://bartoc.org/api/voc/search?query=" . uri_escape($query) );
    my $hits = decode_json( $res->{content} );
    return @$hits;
}

while (<>) {
    my $voc      = decode_json($_);
    my $title    = $voc->{prefLabel}{en};
    my $notation = $voc->{notation}[0];

    if ( !find($title) && !find($notation) ) {
        say encode_json($voc);
    }
}

