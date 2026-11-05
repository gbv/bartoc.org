# BARTOC.org


[![License](https://img.shields.io/github/license/gbv/bartoc-search.svg)](https://github.com/gbv/bartoc.org/blob/master/LICENSE)
[![Docker](https://img.shields.io/badge/Docker-ghcr.io%2Fgbv%2Fjskos--server-informational)](https://github.com/gbv/bartoc.org/blob/master/docker/README.md)
[![Test](https://github.com/gbv/bartoc-search/actions/workflows/test.yml/badge.svg)](https://github.com/gbv/bartoc.org/actions/workflows/test.yml)

> Basic Register of Thesauri, Ontologies & Classifications (BARTOC)

This repository contains the [web interface of BARTOC.org](https://bartoc.org), run by [VZG](https://www.gbv.de/).

The application is currently being reconstructed funded by DFG.

## Table of Contents

- [Install](#install)
- [Data flow](#data-flow)
- ...

## Install

### Requirements

Requires Node.js 22.19 or newer and an instance of [jskos-server](https://github.com/gbv/jskos-server) to connect to. Additional dependencies are listed in `package.json`.

### Install from sources

~~~sh
git clone https://github.com/gbv/bartoc.org.git
cd bartoc.org
npm ci
~~~

### Docker

You can also set up BARTOC via Docker. Please refer to our [Docker docs](./docker/README.md).

### Setup
Clone the auxiliary vocabulary sources beside this repository. The setup script needs both their path and the path to your jskos-server installation:

```bash
git clone https://github.com/gbv/bartoc-vocabularies.git ../bartoc-vocabularies
./bin/setup.sh ../jskos-server ../bartoc-vocabularies
```

To update only the six auxiliary vocabularies later, run `./bin/import-vocabularies.sh ../jskos-server ../bartoc-vocabularies`. This adds or updates their schemes and concepts and sets their `API` field to the target JSKOS Server URL. It does not reset registries or import BARTOC records.

## Configuration

Basic configuration is located in `config/config.default.json`. Selected fields can be overridden in a local `config/config.json`. The latter should at least include a link to a JSKOS server instance, e.g.:

~~~json
{
  "backend": {
    "provider": "ConceptApi",
    "api": "http://localhost:3000/"
  }
}
~~~

To be able to log in, add, and edit vocabularies, you need to setup and configure an instance of [Login Server](https://github.com/gbv/login-server) as well (example for local installation):
```json
{
  "login": {
    "api": "localhost:3004/",
    "ssl": false
  }
}
```

The optional SPARQL query page is enabled by setting `sparql` to an absolute
HTTP(S) endpoint URL. A set of example queries can be provided as MatGUI
[Web workspace](https://github.com/Matdata-eu/MatGUI/blob/main/docs/user-guide.md#web-workspaces)
with `sparqlExamples`:

```json
{
  "sparql": "https://example.org/sparql",
  "sparqlExamples": "https://gbv.github.io/bartoc-queries/workspace.json"
}
```

The query page is available at `/graph/` when `sparql` is configured.

The page also displays the latest knowledge graph update when the endpoint
provides `<https://bartoc.org/graph/terminology/> dct:modified ?updated` in the
named graph `<https://bartoc.org/graph/terminology/>`. This metadata is
optional: if it is missing or cannot be retrieved, the query editor remains
available without the timestamp.

### jskos-server Configuration
To be able to use the full functionality of BARTOC, your jskos-server installation must allow concept schemes to be written via the API, e.g.:

```json
{
  "schemes": {
    "read": {
      "auth": false
    },
    "create": {
      "auth": true
    },
    "update": {
      "auth": true,
      "crossUser": true
    }
  }
}
```

Via an array `identities` under `schemes`, you can limit which identity URIs can write vocabulary data.

## Data flow

Dotted elements are not implemented yet.

```mermaid
graph TD
    server[**server**: express]
    client[**client**: Vue]
    login(login-server)
    search[**search**]
    database[**database**: jskos-server]
    terminologies(terminology services)
    terminologies -- JSKOS API, Skosmos, ... --> client
    server -- RDF & JSKOS --> applications(applications)
    client <-- browser --> user(user)
    subgraph app [**bartoc.org**]
        database <-- JSKOS API --> client
        database -- JSKOS API --> server
        server -- HTML+JS --> client
        search -.-> server
        server -.-> client
        database -.-> search
        reports[**reports**]
        database -.-> reports
    end
    server -.-> applications
    database -- JSKOS API --> applications
    login --> client
    reports -.-> client
    reports -.-> applications
```

## Development

~~~sh
npm run dev
~~~

The application is made available at <http://localhost:3883/>.
Express also serves Vite's development assets on this port.

### CSS approach

Shared design tokens and component-level CSS are provided by `@gbv/bartoc-components`.
Application-specific layout rules live in `static/css/layout.css` and should consume the shared `--cc-*` tokens instead of redefining them.

### Publish
**For maintainers only**

Never work on the main branch directly. Always make changes on `dev` and then run the release script:

```bash
npm run release:patch # or minor or major
```

### Deployment

The application is deployed at <https://bartoc.org/>.

Update an existing installation:

~~~sh
git pull
npm install
npm run build
pm2 restart bartoc.org
~~~

Build the Vue assets before starting or restarting the production server. Docker builds them in the image. `NODE_ENV` must be set to `production` when starting the server; `npm run start` sets it automatically.

## Database dumps and statistics

To regularly update dumps, add a cronjob with command `npm run dump`. Dumps are placed in `data/dumps` and reports in `data/reports`. To compare dump files, run `node bin/dump.js diff FILE1 [FILE2]`.

The dump command also creates quality reports as JSON and CSV files. `validation-errors.json` lists records with validation errors, and `summary.json` groups validation errors and quality warnings by record.
