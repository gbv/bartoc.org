#!/usr/bin/perl
use v5.14.1;

open my $fh, "<", "../ilc1-ilc2.csv";
my %ilc = map { chomp; split ",", $_ } <$fh>;

while (<>) {
    s|"https://bartoc.org(/ILC/1/[^"]+)"|'"'.$ilc{$1}.'"'|egs;
    print $_;
}
