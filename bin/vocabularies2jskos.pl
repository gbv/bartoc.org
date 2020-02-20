#!/usr/bin/env perl
## no critic
use v5.14;
use JSON;
use HTML::Entities;

# convert Drupal JSON export of BARTOC.org vocabularies to JSKOS

my %R;

sub field ($) {
    return grep { $_ } map { s/^\s+|\s+$//g; decode_entities $_ } $R{ $_[0] };
}

sub terms ($) {
    return $R{ $_[0] } =~ /en\/taxonomy\/term\/(\d+)/g;
}

my $IDS;

for (qw(eurovoc ddc language)) {
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
      if $jskos{prefLabel}{und} eq $jskos{prefLabel}{en};

    if ( my @languages = terms 'Language' ) {
        $jskos{languages} =
          [ map { mapid( language => "/en/taxonomy/term/$_" ) } @languages ];
        if ( @languages == 1 && $jskos{prefLabel}{und} ) {
            $jskos{prefLabel}{ $jskos{languages}->[0] } =
              delete $jskos{prefLabel}{und};
        }
    }

    $jskos{altLabel} = { und => [ split /\s*,\s*/, $_ ] }
      for field 'Alternative Title';

    $jskos{extent} = $_ for field 'Size';

    $jskos{startDate} = $1 if $R{'Year of Creation'} =~ />(\d{4})</;

    my @licenses = terms 'License';
    $jskos{license} = \@licenses if @licenses;    # TODO: map to license URIs

    my @ddc;
    push @ddc, mapid( ddc => $1 )
      if $R{'DDC Main Class'} =~ qr{"(/en/DDC-Class/[^"]+)"};
    push @ddc, map { mapid( ddc => $_ ) } ( $R{DDC} =~ /href="([^"]+)"/g );

    say encode_json \%jskos;
}

# TODO:

__END__

    252 ILC
    256 SKOS Vocabulary Service
    259 Contact
   1919 VIAF
    816 Listed in
   1149 Body
   2233 English Abstract
    342 Address - Premise (i.e. Apartment / Suite number)
   2221 Address - Postal code
   2260 Address - Thoroughfare (i.e. Street address)
   2391 Address - Locality (i.e. City)
   2428 Address
   2428 Address - Country
     5 Address - Dependent locality
   2459 EuroVoc
   2479 Author
   2486 Access
   2490 Format
   2992 KOS Types Vocabulary
   2992 Location
