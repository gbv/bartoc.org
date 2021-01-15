# ISO Language Codes (639-1 and 693-2) and IETF Language Types
# Source: https://datahub.io/core/language-codes
# Collected in http://bartoc.org/en/node/20287

.[] |
([.alpha2,.["alpha3-b"],.["alpha3-t"]]|map(select(.!=null))) as $codes |
{
  notation: ($codes),
  uri: ("https://bartoc.org/language/" + ($codes[0])),
  identifier: ($codes|map(
    "http://id.loc.gov/vocabulary/iso639-" +  (.|length-1|tostring) + "/" + .
  )),
  prefLabel: {
    en: (.English|sub("[;(].+";"")),
    fr: (.French|sub("[;(].+";"")),
  },
  # TODO: altLabel
  topConceptOf: [{ uri: "http://bartoc.org/en/node/20287" }]
}
