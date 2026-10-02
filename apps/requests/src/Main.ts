import { checkServerVersion } from '@ValenceDatabase/checkServerVersion';
import { databaseConnectionOf } from '@ValenceDatabase/databaseConnectionOf';
import { checkDialect } from '@ValenceDatabase/checkDialect';
import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { Camoufox } from 'camoufox-js';
import { sql } from 'drizzle-orm';
import { createApp } from '@ValenceRequests/App';
import { applyMigrations } from '#dialect/applyMigrations';
import { createDatabase } from '#dialect/createDatabase';
import { DIALECT } from '#dialect/DIALECT';
import { readEnv } from '@ValenceRequests/env/Env';
import { becomeTheUser } from '@ValenceRequests/env/becomeTheUser';
import { createVpnWatch } from '@ValenceRequests/vpn/createVpnWatch';
import { readGluetun } from '@ValenceRequests/vpn/readGluetun';
import { createDatabaseIndexerStore } from '@ValenceRequests/indexers/createDatabaseIndexerStore';
import { createIndexerClient } from '@ValenceRequests/indexers/createIndexerClient';
import { createIndexerService } from '@ValenceRequests/indexers/createIndexerService';
import { createPacer } from '@ValenceRequests/indexers/createPacer';
import { createSiteClient } from '@ValenceRequests/cardigann/createSiteClient';
import { createSolverWatch } from '@ValenceRequests/solver/createSolverWatch';
import { createBrowserKeeper } from '@ValenceRequests/solver/createBrowserKeeper';
import { createGate } from '@ValenceRequests/solver/createGate';
import { createSiteAgent } from '@ValenceRequests/solver/createSiteAgent';
import { openInTurn } from '@ValenceRequests/solver/openInTurn';
import { createSitePool } from '@ValenceRequests/solver/createSitePool';
import { createSolver } from '@ValenceRequests/solver/createSolver';
import { createDatabaseDefinitionStore } from '@ValenceRequests/definitions/createDatabaseDefinitionStore';
import { createDefinitionCatalogue } from '@ValenceRequests/definitions/createDefinitionCatalogue';
import { createAdapterFor } from '@ValenceRequests/downloads/createAdapterFor';
import { createDatabaseDownloadClientStore } from '@ValenceRequests/downloads/createDatabaseDownloadClientStore';
import { createDatabaseEventStore } from '@ValenceRequests/events/createDatabaseEventStore';
import { createDatabaseSentDownloadStore } from '@ValenceRequests/downloads/createDatabaseSentDownloadStore';
import { createDownloadClientService } from '@ValenceRequests/downloads/createDownloadClientService';
import { createDownloadQueue } from '@ValenceRequests/downloads/createDownloadQueue';
import { createDownloadRoutes } from '@ValenceRequests/downloads/createDownloadRoutes';
import { createDatabaseGiveUpRuleStore } from '@ValenceRequests/downloads/createDatabaseGiveUpRuleStore';
import { createDatabaseProfileStore } from '@ValenceRequests/profiles/createDatabaseProfileStore';
import { seedStarterProfiles } from '@ValenceRequests/profiles/seedStarterProfiles';
import { createDatabaseSettingStore } from '@ValenceRequests/stores/createDatabaseSettingStore';
import { createProfileRoutes } from '@ValenceRequests/profiles/createProfileRoutes';
import { createProfileService } from '@ValenceRequests/profiles/createProfileService';
import { createDatabaseBlockedReleaseStore } from '@ValenceRequests/mediaRequests/createDatabaseBlockedReleaseStore';
import { createDatabaseMediaRequestStore } from '@ValenceRequests/mediaRequests/createDatabaseMediaRequestStore';
import { createDatabaseRequestItemStore } from '@ValenceRequests/mediaRequests/createDatabaseRequestItemStore';
import { createDatabaseRequestLogStore } from '@ValenceRequests/mediaRequests/createDatabaseRequestLogStore';
import { createRequestRoutes } from '@ValenceRequests/mediaRequests/createRequestRoutes';
import { createRequestService } from '@ValenceRequests/mediaRequests/createRequestService';
import { createProbeClient } from '@ValenceRequests/media/createProbeClient';
import { createRequestWorker } from '@ValenceRequests/mediaRequests/createRequestWorker';
import { createArrAppRoutes } from '@ValenceRequests/arrApps/createArrAppRoutes';
import { createArrAppService } from '@ValenceRequests/arrApps/createArrAppService';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { createDatabaseArrAppStore } from '@ValenceRequests/arrApps/createDatabaseArrAppStore';
import { createProwlarrSync } from '@ValenceRequests/arrApps/createProwlarrSync';
import { createHandOffWorker } from '@ValenceRequests/arrApps/handOff/createHandOffWorker';
import { createArrImportRoutes } from '@ValenceRequests/arrImport/createArrImportRoutes';
import { createArrImportService } from '@ValenceRequests/arrImport/createArrImportService';
import type { ArrAppRecord } from '@ValenceRequests/arrApps/ArrAppRecord';
import { z } from 'zod';

const MIGRATIONS_FOLDER = join(import.meta.dirname, '..', 'drizzle', DIALECT);

const SEEDED_PROFILES = 'seededProfileNames';

const SeededProfilesSchema = z.array(z.string());

const env = readEnv(process.env);

checkDialect(env.DATABASE_URL, DIALECT);

const becoming = becomeTheUser({ uid: env.PUID, gid: env.PGID });
const { db, pool } = createDatabase(env.DATABASE_URL, databaseConnectionOf(env));

/**
 * Writes a line to the log, with what the service is in front of it.
 *
 * @param line - What to write.
 */
const log = (line: string): void => {
  process.stdout.write(`[requests] ${line}\n`);
};

log(
  becoming === 'became'
    ? `Running as user ${env.PUID.toString()} and group ${env.PGID.toString()}.`
    : becoming === 'stayedRoot'
      ? 'Running as root, since PUID is 0.'
      : 'Running as the user it was started as.',
);

await checkServerVersion(db);
await applyMigrations(db, MIGRATIONS_FOLDER);

const vpn = createVpnWatch({
  read: () => readGluetun({ address: env.VPN_URL, apiKey: env.VPN_API_KEY, fetch }),
  everyMs: env.VPN_CHECK_SECONDS * 1000,
  onChange: (now) => {
    log(
      now.isUp === true
        ? 'The VPN is up.'
        : `The VPN is down: ${now.problem?.message ?? 'no reason given'}.`,
    );
  },
});

await vpn.start();

const DEFINITIONS_EVERY_MS = 24 * 60 * 60 * 1000;

const SITES_AT_ONCE = 4;

const PAGES_PER_SITE = 2;

const SITE_IDLE_MS = 10 * 60 * 1000;

const BROWSER_RESTART_MS = 12 * 60 * 60 * 1000;

const definitions = createDefinitionCatalogue({
  store: createDatabaseDefinitionStore(db),
  source: {
    repository: env.DEFINITIONS_REPOSITORY,
    branch: env.DEFINITIONS_BRANCH,
    path: env.DEFINITIONS_PATH,
  },
  fetch,
});

const solverWatch = createSolverWatch({
  isRunning: () => browser.isRunning(),
  runningFor: () => browser.upFor(),
  sites: () => sites.size(),
});

const browser = createBrowserKeeper({
  launch: solverWatch.starting(() => {
    log('Starting the browser that gets past Cloudflare’s check.');

    return Camoufox({
      headless: true,
      os: 'linux',
      humanize: true,
      disable_coop: true,
      i_know_what_im_doing: true,
    });
  }),
});

const opening = createGate(1);

const sites = createSitePool({
  open: async () =>
    createSiteAgent(
      await openInTurn(opening, async () => (await browser.get()).newContext()),
      PAGES_PER_SITE,
      opening,
    ),
  most: SITES_AT_ONCE,
  idleMs: SITE_IDLE_MS,
  restartMs: BROWSER_RESTART_MS,
  upFor: browser.upFor,
  retire: browser.retire,
});

const indexers = createIndexerService({
  store: createDatabaseIndexerStore(db),
  definitions: definitions.definition,
  client: createIndexerClient({
    fetch,
    pacer: createPacer(),
    definitions: definitions.definition,
    site: createSiteClient({
      fetch,
      solver: solverWatch.watching(createSolver({ pool: sites })),
    }),
  }),
});

const downloadClients = createDownloadClientService({
  store: createDatabaseDownloadClientStore(db),
  adapterFor: (record) =>
    createAdapterFor(
      record.kind,
      { ...record, categories: Object.values(record.categories) },
      fetch,
    ),
});

const profiles = createProfileService({ store: createDatabaseProfileStore(db) });

const settings = createDatabaseSettingStore(db);

const seeded = await seedStarterProfiles({
  profiles,
  seeded: async () =>
    SeededProfilesSchema.parse(JSON.parse((await settings.read(SEEDED_PROFILES)) ?? '[]')),
  remember: (names) => settings.write(SEEDED_PROFILES, JSON.stringify(names)),
});

if (seeded.length > 0) {
  log(`Started with the ${seeded.join(', ')} quality profiles.`);
}

const sentDownloads = createDatabaseSentDownloadStore(db);

const events = createDatabaseEventStore(db);

const giveUpRules = createDatabaseGiveUpRuleStore(db);

const downloadQueue = createDownloadQueue({
  clients: downloadClients,
  downloads: sentDownloads,
  events,
  indexers: { records: () => indexers.list() },
  fetchRelease: (indexerId, url) => indexers.download(indexerId, url),
  judgeFiles: async (download, videos) => requestWorker.judgeFiles(download, videos),
  refusesUnknownFiles: async () => (await giveUpRules.read()).refusesUnknownFiles,
});

const requestStore = createDatabaseMediaRequestStore(db);

const requestItems = createDatabaseRequestItemStore(db);

const requestLog = createDatabaseRequestLogStore(db);

const arrAppStore = createDatabaseArrAppStore(db);

/**
 * How to ask a connected app, with the key it was given.
 *
 * @param app - The app.
 * @returns How to ask it.
 */
const connectArr = (app: ArrAppRecord) => createArrCaller(fetch, app);

const prowlarrSync = createProwlarrSync({
  indexers: createDatabaseIndexerStore(db),
  connect: connectArr,
});

const arrApps = createArrAppService({
  store: arrAppStore,
  connect: connectArr,
  prowlarr: prowlarrSync,
});

const handOff = createHandOffWorker({
  requests: requestStore,
  items: requestItems,
  apps: arrAppStore,
  connect: connectArr,
  events,
  log: requestLog,
  print: log,
});

const requestWorker = createRequestWorker({
  requests: requestStore,
  items: requestItems,
  blocked: createDatabaseBlockedReleaseStore(db),
  downloads: sentDownloads,
  clients: downloadClients,
  queue: downloadQueue,
  giveUpRules: giveUpRules.read,
  indexers,
  profiles,
  events,
  log: requestLog,
  print: log,
  probe: createProbeClient(env.TRANSCODER_URL, fetch, env.TRANSCODER_SECRET),
  handOff,
});

downloadQueue.start();

const mediaRequests = createRequestService({
  requests: requestStore,
  items: requestItems,
  profiles,
  onChange: requestWorker.nudge,
});

await requestWorker.start();

/**
 * Brings the catalogue of definitions up to date where it is a day old or has never been fetched,
 * saying how it went.
 */
const refreshDefinitions = async (): Promise<void> => {
  if (await definitions.isStale(DEFINITIONS_EVERY_MS)) {
    const read = await definitions.refresh();

    log(
      read.problem?.message ??
        `${read.definitions.length.toString()} indexer definitions from ${read.source}.`,
    );
  }
};

void refreshDefinitions();

const definitionTimer = setInterval(() => {
  void refreshDefinitions();
}, DEFINITIONS_EVERY_MS);

const PROWLARR_EVERY_MS = 60 * 60 * 1000;

/**
 * Brings Valence's indexers in step with every connected Prowlarr, saying how it went.
 */
const syncProwlarr = async (): Promise<void> => {
  for (const { app, outcome } of await arrApps.syncProwlarr()) {
    log(
      'message' in outcome
        ? `${app.name}: ${outcome.message}`
        : `${app.name}: ${outcome.added.toString()} indexers added, ${outcome.updated.toString()} changed, ${outcome.removed.toString()} removed.`,
    );
  }
};

void syncProwlarr();

const prowlarrTimer = setInterval(() => {
  void syncProwlarr();
}, PROWLARR_EVERY_MS);

const app = createApp({
  indexers,
  definitions,
  profiles,
  routes: [
    createDownloadRoutes({
      clients: downloadClients,
      queue: downloadQueue,
      filing: requestWorker,
      rules: giveUpRules,
    }),
    createProfileRoutes(profiles),
    createRequestRoutes({ service: mediaRequests, log: requestLog, worker: requestWorker }),
    createArrAppRoutes({ apps: arrApps }),
    createArrImportRoutes({
      imports: createArrImportService({
        connect: (source) => createArrCaller(fetch, source),
        clients: downloadClients,
        indexers,
        profiles,
        apps: arrApps,
        prowlarr: prowlarrSync,
      }),
    }),
  ],
  secret: env.REQUESTS_SECRET,
  version: env.VALENCE_VERSION,
  readVpn: vpn.current,
  readSolver: solverWatch.current,
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
  log(`Listening on port ${info.port.toString()}.`);
  log(env.VPN_URL === '' ? 'No VPN is set up.' : `Watching the VPN at ${env.VPN_URL}.`);
});

/**
 * Stops watching, closes the server and the pool, and leaves.
 */
const leave = (): void => {
  vpn.stop();
  downloadQueue.stop();
  requestWorker.stop();
  clearInterval(definitionTimer);
  clearInterval(prowlarrTimer);
  server.close();
  void Promise.all([pool.end(), sites.closeAll()]).then(() => process.exit(0));
};

process.on('SIGTERM', leave);
process.on('SIGINT', leave);
