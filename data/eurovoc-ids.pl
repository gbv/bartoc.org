#!/usr/bin/env perl
use v5.14;
use HTTP::Tiny;
use URI::Escape;

# usage: ./eurovoc-ids.pl < eurovoc-select.html
while (<>) {
    $_ =~ /<option value="(\d+)">-*(\d+\s*)?([^<]+)/ or next;
    my ( $id, $label ) = ( $1, $3 );

    my $url = "http://bartoc-skosmos.unibas.ch/EuroVoc/en/search?clang=en&q="
      . uri_escape($label);

    my $res = HTTP::Tiny->new->get($url);
    if ( $res->{success} ) {
        my $html = $res->{success} ? $res->{content} : "";
        if ( $html =~ /1 results for/m && $html =~ /uri-input-box">([^<]+)</m )
        {
            say "$id = $1";
            say STDERR "$id = $1";
        }
        else {
            say "$id ($label) = ?";
            say STDERR "$id ($label) = ?";
        }

    }
    else {
        say STDERR $url;
    }
    sleep 1;
}

