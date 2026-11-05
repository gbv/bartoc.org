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
  fixtureDir,
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
  if (fixtureDir) {
    copyDirs.push({ source: path.resolve(fixtureDir), target: "/test-data" })
  }

  const jskos = await new GenericContainer(image)
    .withNetwork(network)
    .withExposedPorts(3000)
    .withEnvironment({
      NODE_ENV: "test",
    })
    .withCopyContentToContainer([
      {
        content: JSON.stringify(jskosConfig, null, 2),
        target: "/usr/src/app/config/config.test.json",
      },
      {
        content: JSON.stringify(jskosConfig, null, 2),
        target: "/usr/src/app/config/config.json",
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
export async function startJskosStack({ fixtureDir, db } = {}) {
  const network = await new Network().start()
  const mongo = await startMongo({ network })
  const { jskos, baseUrl } = await startJskosServer({ network, fixtureDir, db })

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
 * Import the small vocabulary used by this integration test.
 */
export async function importTestVocabulary(jskosContainer) {
  const scheme = await jskosContainer.exec([
    "node", "./bin/import.js", "schemes", "/test-data/test-vocabulary.scheme.ndjson", "-n",
  ])
  if (scheme.exitCode !== 0) {
    throw new Error(`Import scheme failed:\n${scheme.output}`)
  }

  const concepts = await jskosContainer.exec([
    "node", "./bin/import.js", "concepts", "/test-data/test-vocabulary.concepts.ndjson",
  ])
  if (concepts.exitCode !== 0) {
    throw new Error(`Import concepts failed:\n${concepts.output}`)
  }
}

