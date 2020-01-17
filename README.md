# BARTOC.org

> Relaunch of BARTOC.org web interface

This repository contains the new web interface of BARTOC.org, run at [VZG](https://www.gbv.de/).

*See <https://info.gbv.de/display/DiB/BARTOC-Import> for additional information (internally only)*

## Functional Requirements

* Keep all BARTOC URIs and most URLs
* Provide a nice web interface, possibly multilingual
* Use JSKOS API (in particular DANTE) as backend
* Serve HTML, JSKOS, and RDF

## Install

## Requirements

Requires at least Node.js 10. Additional dependencies are listed in `package.json`.

## Install from sources

~~~sh
git clone https://github.com/gbv/bartoc.org.git
cd bartoc.org
npm install
npm run cache
~~~

## Configuration

Basic configuration is located in `config/config.default.json`. Selected fields can be overridden in a local `config/config.json`.

## Run for testing

~~~sh
npm run start
~~~

The application is made available at <http://localhost:8338/>.

## Deployment

The application is temporarily deployed at <http://bartoc.gbv.de/> and will be made available at <http://bartoc.org/> with the relaunch.

Update an existing installation:

~~~sh
git pull
npm install
pm2 restart bartoc.org
~~~
