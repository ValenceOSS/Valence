import { A_DAY } from '@ValenceMetrics/stats/A_DAY';

/**
 * Brings the database up to date as the server starts, before it answers anything, then forgets
 * installs quiet for a year straight away and once a day after.
 *
 * In development without a database it says so and carries on rather than failing to start, since
 * it runs under `pnpm dev` beside every other workspace and one failing there stops them all.
 *
 * @returns Once the migrations have run, or straight away outside Node or without a database.
 */
const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { isWithoutADatabase } = await import('@ValenceMetrics/db/isWithoutADatabase');

  if (isWithoutADatabase()) {
    return;
  }

  const { migrateDatabase } = await import('@ValenceMetrics/db/migrateDatabase');
  const { openDatabase } = await import('@ValenceMetrics/db/openDatabase');
  const { forgetQuietInstalls } = await import('@ValenceMetrics/reports/forgetQuietInstalls');

  await migrateDatabase();

  const forget = (): void => {
    forgetQuietInstalls(openDatabase(), new Date()).catch(() => 0);
  };

  forget();
  setInterval(forget, A_DAY).unref();
};

export { register };
