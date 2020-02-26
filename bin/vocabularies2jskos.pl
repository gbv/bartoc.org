#!/usr/bin/env perl
## no critic
use v5.14;
use autodie;
use JSON;
use HTML::Entities;

# convert Drupal JSON export of BARTOC.org vocabularies to JSKOS
# Usage: vocabularies2jskos.pl < ../data/vocabularies-dump.ndjson

my %R;

sub field ($) {
    return grep { $_ } map { s/^\s+|\s+$//g; decode_entities $_ } $R{ $_[0] };
}

sub terms ($) {
    return $R{ $_[0] } =~ /(\/en\/taxonomy\/term\/\d+)/g;
}

sub dehtml {
    $_[0] =~ s!<a[^>]+>([^<]+)</a>!\1!g;
    $_[0] =~ s!<br\s*/>!\n\n!gm;
    $_[0] =~ s!^<p>|</p>|</ul>|<li>!!gs;
    $_[0] =~ s!<(p|ul)>|</li>!\n\n!g;
    $_[0] =~ s!<i>|</i>! !g;
    $_[0] =~ s!^\s+|\s+$!!gs;
    $_[0] =~ s!\n\n+!\n\n!g;
    return $_[0];
}

my $IDS;

for (qw(eurovoc ddc language license kostype)) {
    open my $fh, "<", "../data/$_-ids.csv";
    $IDS->{$_} = { map { chomp; split "," } <$fh> };
}

sub mapid {
    $IDS->{ $_[0] }{ $_[1] } // die "unknown $_[0]: $_[1]!\n";
}

## use critic

while (<>) {
    %R = %{ decode_json $_ };

    $R{'no name'} =~ qr{<a href="(/en/node/\d+)">(.+)</a>};

    my %jskos = (
        uri       => "http://bartoc.org$1",
        prefLabel => { und => decode_entities $2 }
    );

    $jskos{identifier} = ["http://www.wikidata.org/entity/$1"]
      if $R{Wikidata} =~ /(Q\d+)/;

    $jskos{prefLabel}{en} = $_ for field 'English Title';
    delete $jskos{prefLabel}{und}
      if ( $jskos{prefLabel}{und} eq $jskos{prefLabel}{en} )
      or !$jskos{prefLabel}{und};

    if ( my @languages = terms 'Language' ) {
        $jskos{languages} =
          [ map { mapid( language => $_ ) } @languages ];
        if ( @languages == 1 && $jskos{prefLabel}{und} ) {
            $jskos{prefLabel}{ $jskos{languages}->[0] } =
              delete $jskos{prefLabel}{und};
        }
    }

    $jskos{altLabel} = { und => [ split /\s*,\s*/, $_ ] }
      for field 'Alternative Title';

    $jskos{extent} = $_ for field 'Size';

    $jskos{startDate} = $1 if $R{'Year of Creation'} =~ />(\d{4})</;

    # Omits: Unknown | All rights reserved | Other
    my @licenses =
      map { { uri => mapid( license => $_ ) } }
      grep { $_ !~ /(14189|51149|14187)/ } terms 'License';
    $jskos{license} = \@licenses if @licenses;

    my @subject;

    push @subject, mapid( ddc => $1 )
      if $R{'DDC Main Class'} =~ qr{"(/en/DDC-Class/[^"]+)"};
    push @subject, map { mapid( ddc => $_ ) } ( $R{DDC} =~ /href="([^"]+)"/g );

    # TODO
    # push @subject, map { mapid( eurovoc => $_ ) } terms 'EuroVoc';

    $jskos{subject} = [ map { { uri => $_ } } @subject ] if @subject;

    $jskos{type} = [
        "http://www.w3.org/2004/02/skos/core#ConceptScheme",
        map { mapid( kostype => $_ ) } terms "KOS Types Vocabulary"
    ];

    my ($body_en) = map { dehtml($_) } field 'English Abstract';
    my ($body)    = map { dehtml($_) } field 'Body';
    if ( $body || $body_en ) {
        $jskos{definition} = {};
        $jskos{definition}{en} = [$body_en] if $body_en;
        my $lang =
          @{ $jskos{languages} || [] } == 1 ? $jskos{languages}[0] : 'und';
        $jskos{definition}{$lang} = [$body] if $body;
    }

    my $publisher;
    my ($viaf) = field 'VIAF';
    if ( $viaf =~ qr{https?://(viaf.org/viaf/\d+)[^>]+>([^<]+)} ) {
        $publisher = { uri => "http://$1", prefLabel => { und => $2 } };
    }
    elsif ( my ($publisher) = field 'Author' ) {
        $publisher = { prefLabel => { und => $publisher } };
    }

    if ($publisher) {
        $jskos{publisher} = [$publisher];
    }

    # TODO:
    #    342 Address - Premise (i.e. Apartment / Suite number)
    #   2221 Address - Postal code
    #   2260 Address - Thoroughfare (i.e. Street address)
    #   2391 Address - Locality (i.e. City)
    #   2428 Address
    #   2428 Address - Country
    #     5 Address - Dependent locality
    #   2992 Location

    # 252 ILC
    #256 SKOS Vocabulary Service
    #259 Contact
    #2486 Access
    #2490 Format
    #816 Listed in

    say encode_json \%jskos;
}
