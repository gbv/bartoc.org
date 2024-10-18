#!/bin/bash

if [ -f /config/cron ]; then
  echo "Found cron file, initializing crontab"
  crontab /config/cron
  crond start
fi

if [[ -z "$BASE_URL" ]]; then
  echo "Error: BASE_URL environment variable is required."
  exit 1
fi

# Add configuration files if necessary
if [ ! -f /config/jskos-server.json ]; then
  echo "
{
  \"mongo\":{
    \"host\":\"mongo\"
    \"db\": \"bartoc\",
  },
  \"baseUrl\": \"${BASE_URL}api/\",
  \"mappings\": false,
  \"annotations\": false,
  \"concordances\": false,
  \"concepts\": true,
  \"schemes\": {
    \"read\": {
      \"auth\": false
    },
    \"create\": {
      \"auth\": true
    },
    \"update\": {
      \"auth\": true,
      \"crossUser\": true
    }
  }
}" >> /config/jskos-server.json
else
  # Update baseUrl in config
  jq ".baseUrl=\"${BASE_URL}api/\"" /config/jskos-server.json > /tmp/jskos-server.json
  rm /config/jskos-server.json
  cp /tmp/jskos-server.json /config/jskos-server.json
fi
if [ ! -f /config/bartoc.json ]; then
  echo "
{
  \"baseUrl\": \"$BASE_URL\",
  \"backend\": {
    \"provider\": \"ConceptApi\",
    \"api\": \"http://localhost:3000/\"
  }
}" >> /config/bartoc.json
else
  # Update baseUrl in config
  jq ".baseUrl=\"$BASE_URL\"" /config/bartoc.json > /tmp/bartoc.json
  rm /config/bartoc.json
  cp /tmp/bartoc.json /config/bartoc.json
fi

# Symlink config files
rm ./jskos-server/config/config.json
ln -s /config/jskos-server.json ./jskos-server/config/config.json
rm ./bartoc/config/config.json
ln -s /config/bartoc.json ./bartoc/config/config.json

# Build indexes on every container start in background (to make sure search is always up-to-date)
(
  cd ./jskos-server || exit
  npm run import -- schemes --indexes &
)

pm2-runtime ecosystem.config.json
