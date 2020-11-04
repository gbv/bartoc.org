#!/usr/bin/env perl
## no critic
use v5.14;
use autodie;
use JSON::PP;

# states were hidden in the dump, so extract it for latter addition
while (<>) {
    my $r = decode_json($_);
    $r->{'no name'} =~ qr{<a href="/../node/(\d+)">(.+)</a>};
    my $uri = "http://bartoc.org/en/node/$1";

    $r->{Address} =~ qr{class="state">([^<]+)} or next;
    say "$uri\t$1";
}
