import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describeOutOfOrderMigrations } from './describeOutOfOrderMigrations';
import { describeSnapshotDrift } from './describeSnapshotDrift';
import { findOutOfOrderMigrations } from './findOutOfOrderMigrations';
import { z } from 'zod';

const ROOT = join(import.meta.dirname, '..', '..');

const APPS = ['server', 'requests'] as const;

const ALREADY_OUT_OF_ORDER: Readonly<Record<string, readonly string[]>> = {
  server: ['0071_grant_requests', '0072_albums_known_by_their_release_group'],
  requests: [],
};

const JournalSchema = z.object({
  entries: z.array(z.object({ tag: z.string(), when: z.number() })),
});

const say = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

/**
 * Every migration and snapshot presently on disk, as paths relative to the migrations directory.
 *
 * @param migrations - The migrations directory.
 * @returns The paths, sorted.
 */
const whatIsThere = (migrations: string): string[] =>
  readdirSync(migrations, { recursive: true, withFileTypes: true })
    .filter((one) => one.isFile())
    .map((one) => relative(migrations, join(one.parentPath, one.name)))
    .sort();

/**
 * Asks drizzle-kit to generate, which writes nothing when the newest snapshot already describes the
 * schema.
 *
 * Generating needs no database — it diffs the schema against the snapshot on disk — so the address
 * is deliberately one nothing answers on, rather than letting a developer's own `.env` decide
 * whether this check can run.
 *
 * @param app - The app whose schema to generate from.
 * @throws If drizzle-kit could not be run at all.
 */
const generate = (app: string): void => {
  const outcome = spawnSync('npx', ['drizzle-kit', 'generate'], {
    cwd: app,
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: 'postgres://nobody:nobody@127.0.0.1:1/nothing' },
  });

  if (outcome.error !== undefined) {
    throw new Error('drizzle-kit could not be run, so the snapshot could not be checked.');
  }
};

/**
 * Checks that the newest snapshot in `drizzle/meta` still describes the schema.
 *
 * Generating on a tree that is in step writes nothing at all, so anything it produces here is a
 * snapshot somebody did not commit — most often because the migration beside it was written by hand.
 * See VAL-193 for what that costs: generation stays silent and starts recreating tables that already
 * exist.
 *
 * Whatever generating wrote is removed again, and the journal put back as it was, so that running
 * this leaves the tree exactly as it found it whether it passes or fails. The server and the requests
 * service each keep their own migrations, so each is checked on its own.
 *
 * @param name - The app to check, by its directory under `apps`.
 */
const checkDrizzleSnapshot = (name: string): void => {
  const app = join(ROOT, 'apps', name);
  const migrations = join(app, 'drizzle');
  const journalPath = join(migrations, 'meta', '_journal.json');
  const before = whatIsThere(migrations);
  const journal = readFileSync(journalPath, 'utf8');

  generate(app);

  const produced = whatIsThere(migrations).filter((one) => !before.includes(one));

  for (const one of produced) {
    rmSync(join(migrations, one), { force: true });
  }

  writeFileSync(journalPath, journal);

  const disorder = describeOutOfOrderMigrations(
    name,
    findOutOfOrderMigrations(
      JournalSchema.parse(JSON.parse(journal)).entries,
      ALREADY_OUT_OF_ORDER[name] ?? [],
    ),
  );

  if (disorder !== null) {
    process.exitCode = 1;
    process.stderr.write(`${disorder}\n`);
  }

  const drift = describeSnapshotDrift(produced);

  if (drift === null) {
    say(`The newest Drizzle snapshot in ${name} still describes the schema.`);

    return;
  }

  process.exitCode = 1;
  process.stderr.write(`${name}: ${drift}\n`);
};

for (const name of APPS) {
  checkDrizzleSnapshot(name);
}
