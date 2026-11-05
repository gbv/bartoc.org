This directory contains data maintained by BARTOC.org.

Auxiliary vocabularies such as BARTOC formats, access modes, languages, and KOS types are maintained in
[bartoc-vocabularies](https://github.com/gbv/bartoc-vocabularies) and imported by `bin/import-vocabularies.sh`.

## Local identifiers

The CSV files map legacy BARTOC URLs to current identifiers. They are used by `routes/redirects.js` and must remain available at runtime.
