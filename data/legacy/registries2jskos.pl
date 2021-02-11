#!/usr/bin/env perl
use v5.14;
use JSON::PP;

# convert Drupal JSON export of BARTOC.org registries to JSKOS

open my $fh, "<", "../eurovoc-ids.csv";
my %eurovoc = map { chomp; split "," } <$fh>;

for ( map { decode_json($_) } <> ) {

    $_->{"no name"} =~ /(\d+)">\s*([^<]+)/ or die;
    my %reg = (
        uri       => "http://bartoc.org/en/node/$1",
        prefLabel => { en => $2 },
        type      => ["http://purl.org/cld/cdtype/CatalogueOrIndex"],
    );
    my @subject;

    if ( $_->{Body} ) {
        $_->{Body} =~ s!<p>|</p>!!g;
        $reg{definition} = { en => [ $_->{Body} ] };
    }

    $reg{identifier} = ["http://www.wikidata.org/entity/$1"]
      if $_->{Wikidata} =~ /(Q\d+)/;

    $reg{url}      = $1 if $_->{Link} =~ /href="([^"]+)"/;
    $reg{endpoint} = $1 if $_->{API} =~ /href="([^"]+)"/;

    push @{ $reg{type} }, "http://bartoc.org/full-repository"
      if $_->{"Repository Type"};

    push @subject, { uri => "http://dewey.info/class/$1/e23/" }
      if $_->{DDC} =~ />(\d{3})/;

    if ( $_->{Topic} =~ /href="([^"]+)"/ ) {
        my $id = $eurovoc{$1} or warn "unknown: $1\n";
        push @subject, { uri => "http://eurovoc.europa.eu/$id" } if $id;
    }

    $reg{endpoint} = $1 if $_->{API} =~ /href="([^"]+)"/;

    $reg{startDate} = $1 if $_->{"Year of Creation"} =~ />(\d{4})</;
    $reg{endDate}   = $1 if $_->{"Year of Dissolution"} =~ />(\d{4})</;

    $reg{subject} = \@subject if @subject;

    say encode_json( \%reg );
}
