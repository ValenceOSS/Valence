import { join } from 'node:path';
import { createDatabase } from '#dialect/createDatabase';
import { DIALECT } from '#dialect/DIALECT';
import { migrateDatabase } from '@ValenceServer/db/migrateDatabase';
import { readEnv } from '@ValenceServer/env/Env';

/**
 * Runs the migrations by hand, for an operator who turned off running them at startup.
 *
 * This exists because the instruction has to be performable where it is printed. `drizzle-kit` is a
 * devDependency and the runtime image installs only production dependencies, so the command the
 * server used to name could never be run by the person reading it. This one ships in the image, next
 * to the server it belongs to, and applies exactly what starting the server would have applied.
 *
 * `MIGRATE_ON_START` is deliberately not consulted. Running this is the consent that variable
 * withholds.
 */
const run = async (): Promise<void> => {
  const env = readEnv(process.env);
  const { db, pool } = createDatabase(env.DATABASE_URL);

  try {
    await migrateDatabase({
      db,
      databaseUrl: env.DATABASE_URL,
      migrations: join(import.meta.dirname, '..', 'drizzle', DIALECT),
      backups: {
        folder: env.BACKUP_DIR,
        keep: env.BACKUPS_KEPT,
        isEnabled: env.BACKUP_BEFORE_MIGRATE,
      },
      isAllowed: true,
      say: (_level, line) => {
        process.stdout.write(`${line}\n`);
      },
    });
  } finally {
    await pool.end();
  }
};

try {
  await run();
} catch (problem) {
  process.stderr.write(
    `The migrations could not be applied: ${problem instanceof Error ? problem.message : 'no reason given'}\n`,
  );
  process.exitCode = 1;
}
