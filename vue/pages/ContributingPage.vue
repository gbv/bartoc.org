<template>
  <h1>Contributing</h1>

  <h2>Technical infrastructure</h2>
  <p>
    BARTOC is based on a technical infrastructure developed as part of
    <a href="https://coli-conc.gbv.de/">coli-conc services</a>.
    All parts are published as Open Source. In particular these are:
  </p>
  <ul>
    <li>
      BARTOC web interface developed in JavaScript with
      <a href="https://v3.vuejs.org/">Vue</a>. See the
      <a href="https://github.com/gbv/bartoc.org#readme">bartoc.org git repository</a>
      for details.
    </li>
    <li><a href="https://gbv.github.io/jskos/jskos.html">JSKOS data format for Knowledge Organization Systems</a></li>
    <li>
      <a href="https://github.com/gbv/jskos-server#readme">JSKOS Server</a> as backend
      database. See <a href="/api/">API</a> for public access.
    </li>
  </ul>

  <h2>BARTOC Content</h2>
  <p>
    BARTOC content is curated by an
    <a href="/contact">international group of editors and collaborators</a>.
    Please contact one of your choice to contribute missing terminologies or to supply corrections!
  </p>

  <p>
    Editors and collaborators are authenticated via their
    <a href="https://orcid.org/">ORCID iD</a>, Wikimedia account, or GitHub account so
    no additional passwords are required. Once a user has been logged in via login
    server (see "login" link in the upper right corner), its user name is shown in the
    menu (please notice: with Firefox you have to create an exeption in privacy settings
    for https://bartoc.org). BARTOC is configured with a list of trusted users: if the
    user is trusted, an
    <a
      class="cc-button cc-button-primary cc-button-sm"
      href="/edit">add</a>
    button is shown in the menu and an
    <a class="cc-button cc-button-primary cc-button-sm">edit</a>
    button is shown next to each terminology title.
  </p>

  <p>
    Adding and editing terminologies is possible with a web form. Its fields are
    documented in the form. When in doubt, feel free to ask so we can improve documentation!
  </p>

  <p>
    All changes are tracked with user and timestamp. All records can be retrieved in
    JSKOS format via <a href="/api/">API</a> and via
    <a href="/download">daily database dumps</a>.
  </p>
</template>

<script setup>
defineOptions({ name: "ContributingPage" })
</script>
