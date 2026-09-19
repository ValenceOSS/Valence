import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createApp } from '@ValenceRequests/App';
import { createDatabase } from '@ValenceRequests/db/Database';
import { readEnv } from '@ValenceRequests/env/Env';
import { createVpnWatch } from '@ValenceRequests/vpn/createVpnWatch';
import { readGluetun } from '@ValenceRequests/vpn/readGluetun';
import { createDatabaseIndexerStore } from '@ValenceRequests/indexers/createDatabaseIndexerStore';
import { createIndexerClient } from '@ValenceRequests/indexers/createIndexerClient';
import { createIndexerService } from '@ValenceRequests/indexers/createIndexerService';
import { createPacer } from '@ValenceRequests/indexers/createPacer';
import { createSiteClient } from '@ValenceRequests/cardigann/createSiteClient';
import { createDatabaseDefinitionStore } from '@ValenceRequests/definitions/createDatabaseDefinitionStore';
import { createDefinitionCatalogue } from '@ValenceRequests/definitions/createDefinitionCatalogue';
import { createAdapterFor } from '@ValenceRequests/downloads/createAdapterFor';
import { createDatabaseDownloadClientStore } from '@ValenceRequests/downloads/createDatabaseDownloadClientStore';
import { createDatabaseDownloadEventStore } from '@ValenceRequests/downloads/createDatabaseDownloadEventStore';
import { createDatabaseSentDownloadStore } from '@ValenceRequests/downloads/createDatabaseSentDownloadStore';
import { createDownloadClientService } from '@ValenceRequests/downloads/createDownloadClientService';
import { createDownloadQueue } from '@ValenceRequests/downloads/createDownloadQueue';
import { createDownloadRoutes } from '@ValenceRequests/downloads/createDownloadRoutes';

const MIGRATIONS_FOLDER = join(import.meta.dirname, '..', 'drizzle');

const env = readEnv(process.env);
const { db, pool } = createDatabase(env.DATABASE_URL);

/**
 * Writes a line to the log, with what the service is in front of it.
 *
 * @param line - What to say.
 */
const say = (line: string): void => {
  process.stdout.write(`[requests] ${line}\n`);
};

await migrate(db, {
  migrationsFolder: MIGRATIONS_FOLDER,
  migrationsSchema: 'valence_requests',
  migrationsTable: '__migrations',
});

const vpn = createVpnWatch({
  read: () => readGluetun({ address: env.VPN_URL, apiKey: env.VPN_API_KEY, fetch }),
  everyMs: env.VPN_CHECK_SECONDS * 1000,
  onChange: (now) => {
    say(
      now.isUp === true
        ? 'The VPN is up.'
        : `The VPN is down: ${now.problem ?? 'no reason given'}.`,
    );
  },
});

await vpn.start();

const DEFINITIONS_EVERY_MS = 24 * 60 * 60 * 1000;

const definitions = createDefinitionCatalogue({
  store: createDatabaseDefinitionStore(db),
  source: {
    repository: env.DEFINITIONS_REPOSITORY,
    branch: env.DEFINITIONS_BRANCH,
    path: env.DEFINITIONS_PATH,
  },
  fetch,
});

const indexers = createIndexerService({
  store: createDatabaseIndexerStore(db),
  definitions: definitions.definition,
  client: createIndexerClient({
    fetch,
    pacer: createPacer(),
    definitions: definitions.definition,
    site: createSiteClient({ fetch, flareSolverrUrl: env.FLARESOLVERR_URL }),
  }),
});

const downloadClients = createDownloadClientService({
  store: createDatabaseDownloadClientStore(db),
  adapterFor: (record) => createAdapterFor(record.kind, record, fetch),
});

const downloadQueue = createDownloadQueue({
  clients: downloadClients,
  downloads: createDatabaseSentDownloadStore(db),
  events: createDatabaseDownloadEventStore(db),
  fetchRelease: (indexerId, url) => indexers.download(indexerId, url),
});

downloadQueue.start();

/**
 * Brings the catalogue of definitions up to date where it is a day old or has never been fetched,
 * saying how it went.
 */
const refreshDefinitions = async (): Promise<void> => {
  if (await definitions.isStale(DEFINITIONS_EVERY_MS)) {
    const read = await definitions.refresh();

    say(
      read.problem ??
        `${read.definitions.length.toString()} indexer definitions from ${read.source}.`,
    );
  }
};

void refreshDefinitions();

const definitionTimer = setInterval(() => {
  void refreshDefinitions();
}, DEFINITIONS_EVERY_MS);

const app = createApp({
  indexers,
  definitions,
  downloads: createDownloadRoutes({ clients: downloadClients, queue: downloadQueue }),
  secret: env.REQUESTS_SECRET,
  version: env.VALENCE_VERSION,
  readVpn: vpn.current,
  isDatabaseUp: async () => {
    try {
      await db.execute(sql`select 1`);

      return true;
    } catch {
      return false;
    }
  },
});

const server = serve({ fetch: app.fetch, port: env.REQUESTS_PORT }, (info) => {
  say(`Listening on port ${info.port.toString()}.`);
  say(env.VPN_URL === '' ? 'No VPN is set up.' : `Watching the VPN at ${env.VPN_URL}.`);
});

/**
 * Stops watching, closes the server and the pool, and leaves.
 */
const leave = (): void => {
  vpn.stop();
  downloadQueue.stop();
  clearInterval(definitionTimer);
  server.close();
  void pool.end().then(() => process.exit(0));
};

process.on('SIGTERM', leave);
process.on('SIGINT', leave);
