import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createApp } from '@ValenceRequests/App';
import { createDatabase } from '@ValenceRequests/db/Database';
import { readEnv } from '@ValenceRequests/env/Env';
import { createVpnWatch } from '@ValenceRequests/vpn/createVpnWatch';
import { readGluetun } from '@ValenceRequests/vpn/readGluetun';

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

await db.execute(sql`create schema if not exists valence_requests`);
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

const app = createApp({
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

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  say(`Listening on port ${info.port.toString()}.`);
  say(env.VPN_URL === '' ? 'No VPN is set up.' : `Watching the VPN at ${env.VPN_URL}.`);
});

/**
 * Stops watching, closes the server and the pool, and leaves.
 */
const leave = (): void => {
  vpn.stop();
  server.close();
  void pool.end().then(() => process.exit(0));
};

process.on('SIGTERM', leave);
process.on('SIGINT', leave);
