/**
 * Whether the site is running in development with no database, saying so on the way.
 *
 * The site runs with every other workspace under `pnpm dev`, where most people have no database for
 * it, and one package failing to start there stops all of them. In production a missing database
 * still stops it, since nothing it does works without one.
 *
 * @returns Whether to leave the database alone.
 */
const isWithoutADatabase = (): boolean => {
  if (process.env.NODE_ENV === 'production' || (process.env.DATABASE_URL ?? '') !== '') {
    return false;
  }

  process.stderr.write(
    'metrics: DATABASE_URL is not set, so the database is left alone and reports will fail\n',
  );

  return true;
};

export { isWithoutADatabase };
