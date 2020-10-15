---
title: Contributing
---

## Technical infrastructure

BARTOC is based on a technical infrastructure developed as part of [project coli-conc](https://coli-conc.gbv.de/).
All parts are published as Open Source. In particular these are:

* BARTOC web interface developed in JavaScript with [Vue](https://v3.vuejs.org/). See the [bartoc.org git repository](https://github.com/gbv/bartoc.org#readme) for details.
* [JSKOS data format for Knowledge Organization Systems](https://gbv.github.io/jskos/jskos.html)
* [JSKOS Server](https://github.com/gbv/jskos-server#readme) as backend database. See [API](/api/) for public access.

## BARTOC Content

BARTOC content is curated by an [international group of editors and collaborators](/contact). Please contact one of your choice to contribute missing vocabularies or to supply corrections!

Editors and collaborators are authentificated via their [ORCID iD](https://orcid.org/) so no additional passwords are required. BARTOC is configured with a list of trusted ORCIDs. Once a user has been logged in with its ORCID via login server (see "login" link in the upper right corner), an <a class="btn btn-success btn-sm" href="/edit">add</a> button is shown in the menu and an <a class="btn btn-success btn-sm">edit</a> button is shown next to each vocabulary title. The fields are documented in the edit form.

All changes are tracked with user and timestamp. All records can be retrieved in JSKOS format via [API](/api/) and via [daily database dumps](/download).
