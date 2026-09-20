/**
 * Says what to do about migrations stamped below one that comes before them.
 *
 * @param app - The app whose journal it is.
 * @param found - The tags found out of order.
 * @returns What to fail with, or nothing where there were none.
 */
const describeOutOfOrderMigrations = (app: string, found: readonly string[]): string | null => {
  if (found.length === 0) {
    return null;
  }

  return [
    `${app}: these migrations are stamped no later than one listed before them, which drizzle skips`,
    'on every database that ran the later one first:',
    '',
    ...found.map((tag) => `  ${tag}`),
    '',
    `Raise each one's "when" in apps/${app}/drizzle/meta/_journal.json above the newest stamp in the`,
    'journal. That is safe for a migration nobody has applied yet, which is what one that has just been',
    'merged is; never change the stamp of one a database has already run.',
  ].join('\n');
};

export { describeOutOfOrderMigrations };
