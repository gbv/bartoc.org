FROM node:20-alpine
WORKDIR /usr/src/app

## Show version numbers for Node and npm
RUN node -v
RUN npm -v

## We need bash, git, jq
RUN apk add bash
RUN apk add git
RUN apk add jq

## Copy source and install dependencies
RUN mkdir ./bartoc
COPY . ./bartoc
RUN cd bartoc && npm ci

COPY docker/ecosystem.config.json .

## Make Docker-related scripts available in root folder
COPY docker/*.sh .

## Get latest JSKOS Server and install dependencies
RUN git clone https://github.com/gbv/jskos-server.git && cd jskos-server && npm ci

## Folder for configuration files (to be mapped as volume)
RUN mkdir /config

# Use pm2 to run app
RUN npm i -g pm2

CMD ["bash", "entrypoint.sh"]
