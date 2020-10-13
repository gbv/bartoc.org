#!/usr/bin/env perl
use v5.14;
use HTTP::Tiny;

# Harvest rating of all vocabularies in BARTOC.org

for ( my $i = 0 ; $i <= 30 ; $i++ ) {
    my $url = "https://bartoc.org/en/top-rated-points?page=$i";

    my $res = HTTP::Tiny->new->get($url);
    if ( !$res->{success} ) {
        say STDERR "failed $url";
    }
    else {
        my $html = $res->{content};
        for my $row ( $html =~ /<tr(.+?)<\/tr>/sg ) {
            $row =~ /([0-9,]+) points/;
            my $points = $1 =~ s/,//gr;
            if ( $row =~ /<a href="(\/en\/node\/\d+)">/ ) {
                say "http://bartoc.org$1,$points";
            }
        }
    }
}
