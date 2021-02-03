# BARTOC.org

> Relaunch of BARTOC.org web interface

This repository contains the [new web interface of BARTOC.org](https://bartoc.org), run by [VZG](https://www.gbv.de/).

## Functional Requirements

* Keep all BARTOC URIs and most URLs
* Provide a nice web interface, possibly multilingual
* Use JSKOS API as backend
* Serve HTML, JSKOS, and RDF

## Install

## Requirements

Requires at least Node.js 10 and an instance of [jskos-server](https://github.com/gbv/jskos-server) to connect to. Additional dependencies are listed in `package.json`.

## Install from sources

~~~sh
git clone https://github.com/gbv/bartoc.org.git
cd bartoc.org
npm install
~~~

## Setup
A setup script is provided in `./bin/setup.sh`. It must be called with the path to your jskos-server installation, e.g.:

```bash
./bin/setup.sh ../jskos-server
```

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

## Run for testing

~~~sh
npm run dev
~~~

The application is made available at <http://localhost:3883/>.

## Deployment

The application is deployed at <http://bartoc.org/>.

Update an existing installation:

~~~sh
git pull
npm install
pm2 restart bartoc.org
~~~

Note that `NODE_ENV` has to be set to `production`, otherwise Vue files will be requested from the dev server. This is given when using `npm run start`.

## Database dumps

To regularly update dumps, add a cronjob with command `npm run dump update`. Dumps will be placed in directory `data/dumps`. To compare two dump files run `npm run dump diff`.
