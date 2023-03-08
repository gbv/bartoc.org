---
title: Contributing
---

## Technical infrastructure

BARTOC is based on a technical infrastructure developed as part of [coli-conc services](https://coli-conc.gbv.de/).
All parts are published as Open Source. In particular these are:

* BARTOC web interface developed in JavaScript with [Vue](https://v3.vuejs.org/). See the [bartoc.org git repository](https://github.com/gbv/bartoc.org#readme) for details.
* [JSKOS data format for Knowledge Organization Systems](https://gbv.github.io/jskos/jskos.html)
* [JSKOS Server](https://github.com/gbv/jskos-server#readme) as backend database. See [API](/api/) for public access.

## BARTOC Content

BARTOC content is curated by an [international group of editors and collaborators](/contact). Please contact one of your choice to contribute missing vocabularies or to supply corrections!

Editors and collaborators are authenticated via their [ORCID iD](https://orcid.org/), Wikimedia account, or GitHub account so no additional passwords are required. Once a user has been logged in via login server (see "login" link in the upper right corner), its user name is shown in the menu (please notice: with Firefox you have to create an exeption in privacy settings for https://bartoc.org). 
BARTOC is configured with a list of trusted users: if the user is trusted, an <a class="btn btn-success btn-sm" href="/edit">add</a> button is shown in the menu and an <a class="btn btn-success btn-sm">edit</a> button is shown next to each vocabulary title.

Adding and editing vocabularies is possible with a web form. Its fields are documented in the form. When in doubt, feel free to ask so we can improve documentation!

All changes are tracked with user and timestamp. All records can be retrieved in JSKOS format via [API](/api/) and via [daily database dumps](/download).
