<template>
  <h1>Download</h1>

  <p>
    The content of BARTOC is available in several formats under the
    <a href="http://www.opendatacommons.org/licenses/pddl/1.0/">Public Domain Dedication and License</a>
    (Public Domain). Content of individual terminologies listed in and available
    <em>via</em> BARTOC has individual licenses.
  </p>

  <h2>Linked Open Data (RDF)</h2>
  <p>
    Each record is identifier by an URI of the form <code>http://bartoc.org/en/node/{ID}</code>
    where <code>{ID}</code> is a number. For instance the International Classification
    of Diseases (ICD) has URI <a href="/en/node/447">http://bartoc.org/en/node/447</a>
    (mind it starts with <code>http://</code>, not <code>https://</code>). Record data
    can be accessed in RDF by appending <code>?format=nt</code> or <code>?format=rdfxml</code>
    to its URI. The footer contains a corresponding links <strong>RDF</strong> and
    <strong>XML</strong>. RDF data of all records is aggregated daily in a triple store
    with SPARQL query interface at <a href="http://bartoc.org/graph/">http://bartoc.org/graph/</a>.
  </p>

  <h2>JSKOS format</h2>
  <p>
    Each BARTOC entry can be accessed in <a href="https://gbv.github.io/jskos/">JSKOS format</a>
    by appending <code>?format=json</code> to its URI. The footer contains a
    corresponding <strong>JSON</strong> link.
  </p>

  <h2>API</h2>
  <p>
    BARTOC can be accessed at <a href="/api/">https://bartoc.org/api/</a> via JSKOS API
    to query and filter terminology and registry metadata.
  </p>

  <h2>Database dumps</h2>
  <p>
    There is a <a href="/data/dumps/latest.ndjson">daily database dump</a> in NDJSON
    format (each line a JSKOS record). Registry metadata can be downloaded from the
    <a href="/api/registries?limit=10000">registries API</a> in JSKOS format.
  </p>
</template>

<script setup>
defineOptions({ name: "DownloadPage" })
</script>
