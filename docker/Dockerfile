FROM node:20-alpine
WORKDIR /usr/src/app

## Show version numbers for Node and npm
RUN node -v
RUN npm -v

## We need bash and git.
RUN apk add --no-cache bash
RUN apk add --no-cache git

# Copy and install dependencies
RUN mkdir ./bartoc.org
COPY package-lock.json ./bartoc.org
RUN cd bartoc.org && npm ci

# Bundle app source
COPY . ./bartoc.org
COPY docker/entrypoint.sh .
COPY docker/ecosystem.config.json .

## Get jskos-server source code
RUN git clone https://github.com/gbv/jskos-server.git && cd jskos-server && npm ci

RUN mkdir /config

# Use pm2 to run app
RUN npm i -g pm2

CMD ["bash", "entrypoint.sh"]
