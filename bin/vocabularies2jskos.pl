#!/usr/bin/env perl
## no critic
use v5.14;
use autodie;
use JSON::PP;
use List::Util qw(uniq);

# convert Drupal JSON export of BARTOC.org vocabularies to JSKOS
# Usage: vocabularies2jskos.pl ../data/download.ndjson < ../data/vocabularies-dump.ndjson

my %R;

sub decode_entities($) {    # dump only contains these entities
    my $s = shift;
    $s =~ s/&gt;/>/g;
    $s =~ s/&lt;/>/g;
    $s =~ s/&quot;/"/g;
    $s =~ s/&#039;/'/g;
    $s =~ s/&amp;/&/g;
    return $s;
}

sub field ($) {
    return grep { $_ } map { s/^\s+|\s+$//g; decode_entities $_ } $R{ $_[0] };
}

sub terms ($) {
    return $R{ $_[0] } =~ /(\/en\/taxonomy\/term\/\d+)/g;
}

sub dehtml {
    $_[0] =~ s!<a.+?href="([^"]+)"[^<]+</a>!\1!g;
    $_[0] =~ s!<br\s*/>!\n\n!gm;
    $_[0] =~ s!^<p>|</p>|</ul>|<li>!!gs;
    $_[0] =~ s!<(p|ul)>|</li>!\n\n!g;
    $_[0] =~ s!<i>|</i>! !g;
    $_[0] =~ s!^\s+|\s+$!!gs;
    $_[0] =~ s!\n\n+!\n\n!g;
    return decode_entities $_[0];
}

sub dehtmlist {
    return grep { $_ ne "" } split /\s*,\s*/, dehtml @_;
}

my $IDS;

for (qw(eurovoc ddc language license kostype)) {
    open my $fh, "<", "../data/$_-ids.csv";
    $IDS->{$_} = { map { chomp; split "," } <$fh> };
}

sub mapid {
    my ( $voc, $id ) = @_;
    return "https://bartoc.org/ILC/$id" if $voc eq 'ilc';
    $IDS->{$voc}{$id} // say STDERR "unknown $voc: $id\n";
}

my %vocuri = (
    ddc     => "http://bartoc.org/en/node/241",
    eurovoc => "http://bartoc.org/en/node/15",
    ilc     => "http://bartoc.org/de/node/472"
);

sub mapsubject {
    my ( $voc, $id ) = @_;
    return {
        uri => mapid( $voc => $id ),
        inScheme => [ { uri => $vocuri{$voc} } ]
    };
}

sub mapformat {
    $_[0] =~ qr{/([^/]+)$};
    my $format = $1;

    # reduce number of formats
    $format = 'RDF' if $format =~ /(Turtle|N-Quads|N-Triples|N3|TriX|TriG)/;
    $format = 'Spreadsheet' if $format =~ /(XLS|XLSX|ODS)/;
    $format = 'CSV'         if $format =~ /^(TAB|CSV)$/;
    $format = 'Word'        if $format =~ /(DOC|DOCX|RTF|ODT)/;
    $format = 'MARC'        if $format =~ /MARC/;
    $format = 'HTML'        if $format =~ /HTML/;
    $format = 'TXT'         if $format =~ /^(ASCII|PCC)$/;
    $format = 'Database'    if $format =~ /^(MS-Access|MDB|MySQL-Dump)$/;
    $format = 'Geodata'     if $format =~ /^(KML|MapInfo|GeoJSON)$/;
    return
      if grep { $format eq $_ }    # too rare or too specific
      qw(RSS DTD DjVu E-Book ESRI TIFF Isabelle 58674 YML G2KI CLIPS N1TS LIST SGML SPS);

    return { uri => "http://bartoc.org/en/Format/$format" };
}

## use critic

my %month = (
    January   => '01',
    February  => '02',
    March     => '03',
    April     => '04',
    May       => '05',
    June      => '06',
    July      => '07',
    August    => '08',
    September => '09',
    October   => '10',
    November  => '11',
    December  => '12'
);

sub date {
    $_[0] =~
      s/^.+? ([A-Z]+) (\d+), (\d{4})/"$3-".$month{$1}.sprintf("-%02d",$2)/ie;
    $_[0] =~ s/ - /T/;
    return "$_[0]:00Z";
}

open( my $fh, "<", shift @ARGV ) or die "failed to open download.ndjson";
my %download = map {
    my $r     = decode_json($_);
    my $jskos = {
        created  => date( $r->{'Post date'} ),
        modified => date( $r->{'Updated date'} )
    };
    if ( $r->{Link} ) {
        my @links = grep { $_ =~ qr{^https?://[^ ]+$} } dehtmlist $r->{Link};
        if ( @links == 1 ) {
            $jskos->{url} = $links[0];
        }
        else {
            $jskos->{subjectOf} = [ map { { url => $_ } } @links ];
        }
    }
    ( $r->{Nid} => $jskos );
} <$fh>;
close $fh;

while (<>) {
    %R = %{ decode_json $_ };

    $R{'no name'} =~ qr{<a href="/../node/(\d+)">(.+)</a>};

    my %jskos = (
        uri       => "http://bartoc.org/en/node/$1",
        prefLabel => { und => decode_entities $2 },
        %{ $download{$1} }
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
    push @subject, mapsubject( ddc => $1 )
      if $R{'DDC Main Class'} =~ qr{"(/en/DDC-Class/[^"]+)"};
    push @subject,
      map { mapsubject( ddc => $_ ) } ( $R{DDC} =~ /href="([^"]+)"/g );

    push @subject, map { mapsubject( eurovoc => $_ ) } terms 'EuroVoc';

    my @ilc =
      map { mapsubject( ilc => $_ ) } ( $R{ILC} =~ /"\/en\/ILC\/([^"]+)"/g );
    push @subject, @ilc;

    $jskos{subject} = \@subject if @subject;

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

    $jskos{CONTACT} = dehtml( $R{Contact} ) =~ s/^mailto://r if $R{Contact};

    if ( $R{Address} ) {

        # will require cleanup later
        $jskos{ADDRESS} = {};
        my %field = (
            country  => 'Address - Country',
            postcode => 'Address - Postal code',
            city     => 'Address - Locality (i.e. City)',
            address  => 'Address - Thoroughfare (i.e. Street address)',
            locality => 'Address - Dependent locality',
            premise  => 'Address - Premise (i.e. Apartment / Suite number)',
            subpremise =>
              'Address - Sub Premise (i.e. Suite, Apartment, Floor, Unknown.',
            company   => 'Address - Company',
            firstname => 'Address - First name',
            fullname  => 'Address - Full name',
            lastname  => 'Address - Last name',
            area      => 'Address - Sub administrative area'
        );
        $jskos{ADDRESS} = {
            map { ( $_ => $R{ $field{$_} } ) }
            grep { $R{ $field{$_} } } keys %field
        };
    }

    # will require cleanup later
    if ( $R{Location} ) {
        $jskos{LOCATION} = [ ( $R{Location} =~ /"\/en\/Location\/([^"]+)"/g ) ];
    }

    if ( $R{'SKOS Vocabulary Service'} ) {
        $jskos{API} =
          [ dehtmlist $R{'SKOS Vocabulary Service'} ];
    }

    if ( $R{Format} ) {

        # will require cleanup later
        $jskos{FORMAT} = [ uniq map { mapformat $_ } ( dehtmlist $R{Format} ) ];
    }

    if ( $R{'Listed in'} ) {
        my @registries = map { { uri => "http://$_" } }
          ( $R{'Listed in'} =~ qr{(bartoc.org/en/node/\d+)}m );
        $jskos{partOf} = \@registries if @registries;
    }

    if ( $R{Access} ) {

        # will require cleanup later
        $jskos{ACCESS} = [ dehtmlist $R{'Access'} ];
    }

    say encode_json \%jskos;
}
