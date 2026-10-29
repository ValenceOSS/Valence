/**
 * Brings the database up to date as the server starts, before it answers anything.
 *
 * @returns Once the migrations have run, or straight away outside Node.
 */
const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { migrateDatabase } = await import('@ValenceMetrics/db/migrateDatabase');

  await migrateDatabase();
};

export { register };
