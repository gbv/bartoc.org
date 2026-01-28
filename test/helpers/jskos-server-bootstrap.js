// test/helpers/jskos-stack.js
import { GenericContainer, Network, Wait } from "testcontainers"
import path from "node:path"

/**
 * Small HTTP poller with timeout.
 * If container is passed, its logs will be printed on timeout.
 */
export async function waitHttp(url, timeoutMs, { container } = {}) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    try {
      const r = await fetch(url)
      if (r.ok) {
        return
      }
    } catch (e) {
      console.error(e)
    }
    await new Promise(r => setTimeout(r, 300))
  }
  if (container) {
    const logs = await container.logs()
    console.error(`Timeout waiting for ${url}\n--- container logs ---\n${logs}`)
  }
  throw new Error(`Timeout waiting for ${url}`)
}

/**
 * Start ONLY mongo container on given docker network.
 */
export async function startMongo({ network, image = "mongo:7", alias = "mongo" } = {}) {
  const mongo = await new GenericContainer(image)
    .withNetwork(network)
    .withNetworkAliases(alias) // jskos-server will connect to "mongo"
    .withExposedPorts(27017)
    .withWaitStrategy(Wait.forListeningPorts())
    .start()

  // quick ping inside the container
  const ping = await mongo.exec([
    "mongosh",
    "--quiet",
    "--eval",
    "db.runCommand({ ping: 1 }).ok",
  ])
  if (ping.exitCode !== 0 || ping.output.trim() !== "1") {
    const logs = await mongo.logs()
    throw new Error(`Mongo ping failed:\n${ping.output}\n--- logs ---\n${logs}`)
  }

  return mongo
}

/**
 * Start jskos-server container connected to mongo on the same docker network.
 * - Injects config via CONFIG_FILE=/config/config.json ?
 */
export async function startJskosServer({
  network,
  mongoHost = "mongo",
  db = "bartoc-test",
  image = process.env.JSKOS_IMAGE || "ghcr.io/gbv/jskos-server:latest",
  dataDir, // optional: copy BARTOC ./data to /bartoc-data
} = {}) {
  const jskosConfig = {
    mongo: { host: mongoHost, db },
    baseUrl: "http://localhost:3000/",

    // keep it minimal for smoke
    mappings: false,
    annotations: false,
    concordances: false,
    concepts: true,
    schemes: { read: { auth: false } },
  }

  const copyDirs = []
  if (dataDir) {
    copyDirs.push({ source: path.resolve(dataDir), target: "/bartoc-data" })
  }

  const jskos = await new GenericContainer(image)
    .withNetwork(network)
    .withExposedPorts(3000)
    .withEnvironment({
      NODE_ENV: "test",
      CONFIG_FILE: "/config/config.json",
    })
    .withCopyContentToContainer([
      {
        content: JSON.stringify(jskosConfig, null, 2),
        target: "/config/config.json",
      },
    ])
    .withCopyDirectoriesToContainer(copyDirs)
    .withWaitStrategy(Wait.forHttp("/status", 3000))
    .start()

  const baseUrl = `http://${jskos.getHost()}:${jskos.getMappedPort(3000)}`
  await waitHttp(`${baseUrl}/status`, 60_000, { container: jskos })

  return { jskos, baseUrl }
}

/**
 * Convenience: start network + mongo + jskos-server and return a single handle.
 */
export async function startJskosStack({ dataDir, db } = {}) {
  const network = await new Network().start()
  const mongo = await startMongo({ network })
  const { jskos, baseUrl } = await startJskosServer({ network, dataDir, db })

  return {
    network,
    mongo,
    jskos,
    baseUrl,
    async stop() {
      await jskos.stop()
      await mongo.stop()
      await network.stop()
    },
  }
}

/**
 * Import internal vocabs (like bin/setup.sh) with two exec calls.
 */
export async function importInternalVocs(jskosContainer) {
  // 1) schemes (all in one go)
  const schemes = [
    "/bartoc-data/bartoc-formats.scheme.ndjson",
    "/bartoc-data/bartoc-access.scheme.ndjson",
    "/bartoc-data/ddc.scheme.ndjson",
    "/bartoc-data/languages.scheme.ndjson",
    "/bartoc-data/nkostype.scheme.ndjson",
    "/bartoc-data/bartoc-api-types.scheme.ndjson",
    "/bartoc-data/eurovoc.scheme.ndjson",
    "/bartoc-data/ilc.scheme.ndjson",
  ]

  // 2) concepts (all in one go)
  const concepts = [
    "/bartoc-data/bartoc-formats.concepts.ndjson",
    "/bartoc-data/bartoc-access.concepts.ndjson",
    "/bartoc-data/ddc100.concepts.ndjson",
    "/bartoc-data/languages.concepts.ndjson",
    "/bartoc-data/nkostype.concepts.ndjson",
    "/bartoc-data/bartoc-api-types.concepts.ndjson",
  ]

  // Prefer calling the import script directly instead of npm run import
  const res1 = await jskosContainer.exec(["node", "./bin/import.js", "schemes", ...schemes, "-n"])
  if (res1.exitCode !== 0) {
    throw new Error(`Import schemes failed:\n${res1.output}`)
  }

  const res2 = await jskosContainer.exec(["node", "./bin/import.js", "concepts", ...concepts])
  if (res2.exitCode !== 0) {
    throw new Error(`Import concepts failed:\n${res2.output}`)
  }
}

