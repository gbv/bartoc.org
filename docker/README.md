# [BARTOC (Docker)](https://github.com/gbv/bartoc.org)

See https://bartoc.org/about or [GitHub](https://github.com/gbv/bartoc.org) for more information about the project.

## Supported Architectures
Currently, only `x86-64` is supported, but we are planning to add more architectures soon.

## Available Tags
- The current release version is available under `latest`. However, new major versions might break compatibility of the previously used config file, therefore it is recommended to use a version tag instead.
- We follow SemVer for versioning the application. Therefore, `x` offers the latest image for the major version x, `x.y` offers the latest image for the minor version x.y, and `x.y.z` offers the image for a specific patch version x.y.z.
- Additionally, the latest development version is available under `dev`.

## Usage
It is recommended to run the image using [Docker Compose](https://docs.docker.com/compose/) together with the required MongoDB database for the included instance of [JSKOS Server]. Note that depending on your system, it might be necessary to use `sudo docker compose`. For older Docker versions, use `docker-compose` instead of `docker compose`.

1. Create `docker-compose.yml`:

```yml
services:
  bartoc:
    image: ghcr.io/gbv/bartoc.org
    depends_on:
      - mongo
    volumes:
      - ./data/config:/config
      - ./data/dumps:/usr/src/app/bartoc/data/dumps
      - ./data/reports:/usr/src/app/bartoc/data/reports
    environment:
      # BASE_URL is required and will be used for both BARTOC and JSKOS Server
      - BASE_URL=http://localhost:3883/
    ports:
      - 3883:3883
    restart: unless-stopped

  # MongoDB required for JSKOS Server; you can use an external MongoDB as well (needs to be configured in data/config/jskos-server.json)
  mongo:
    image: mongo:7
    volumes:
      - ./data/db:/data/db
    restart: unless-stopped
```

2. Create data folders:

```bash
mkdir -p ./data/{config,db,dumps,reports}
```

3. Start the application:

```bash
docker compose up -d
```

This will create and start a BARTOC container running under host port 3883 with data persistence under `./data`:

- `./data/config`: configuration files required for BARTOC (`bartoc.json`) and [JSKOS Server] (`jskos-server.json`), see below
- `./data/db`: data of the MongoDB container (note: make sure MongoDB data persistence works with your system, see section "Where to Store Data" [here](https://hub.docker.com/_/mongo))
- `./data/dumps`: dumps folder
- `./data/reports`: latest reports folder

You can now access the application under `http://localhost:3883`.

## Application Setup
Note: After adjusting any configurations, it is required to restart or recreate the container:
- After changing configuration files, restart the container: `docker compose restart bartoc`
- After changing `docker-compose.yml` (e.g. adjusting environment variables), recreate the container: `docker compose up -d`

### First Run
If you are using a fresh database, please use BARTOC's setup script to prefill it with necessary vocabularies:

```sh
docker compose exec -it bartoc bash setup.sh
```

It might be required to run this command again after an update. Please refer to the release notes.

### Configuration
The folder `/config` (mounted as `./data/config` if configured as above) contains the configuration files `bartoc.json` and `jskos-server.json` where BARTOC and its included instance of [JSKOS Server] are configured. It is recommended to let the container create the first version of these configuration files on first start and adjust it to your needs afterwards.

Please refer to the documentation ([BARTOC](https://github.com/gbv/bartoc.org#configuration), [JSKOS Server](https://github.com/gbv/jskos-server#configuration)) to see how to configure the application.

### Environment Variables
| Environment Variable | Description                                                                                   | Example Value       |
|----------------------|-----------------------------------------------------------------------------------------------|---------------------|
| `BASE_URL`           | The base URL for the application and its included instance of [JSKOS Server] (running under `${BASE_URL}api`). Needs to have a trailing slash.                                         | `https://bartoc.org/`          |

### Data Management
If you need direct access to the import/reset scripts of the included instance of [JSKOS Server], you can run them like this:

```sh
# Import script (requires parameters)
docker compose exec -it bartoc /usr/src/app/jskos-server/bin/import.js
# Reset script (optional parameters)
docker compose exec -it bartoc /usr/src/app/jskos-server/bin/reset.js
```

For more info about how to use these commands, please refer to [this section](https://github.com/gbv/jskos-server#data-import) in the documentation.

**Note:** If local files are imported, these have to be mounted into the container first, and the path inside the container has to be given. For example, you could mount the host folder `./data/imports` to `/imports` inside the container and then use the path `/imports/myfile.ndjson` with the import command.

### Scheduled Dumps
Cron is configured inside the container to allow scheduled dumps. You can provide a cronfile by mounting it into `/config/cron`. Example cronfile:

```cron
00 04 * * * cd /usr/src/app/bartoc && npm run dump update > /proc/1/fd/1 2>/proc/1/fd/2
```

Note that the redirection is necessary so that the script's output shows up in the Docker logs.

[JSKOS Server]: https://github.com/gbv/jskos-server
