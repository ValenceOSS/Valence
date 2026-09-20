type JournalEntry = { tag: string; when: number };

/**
 * Finds the migrations stamped no later than one listed before them.
 *
 * Drizzle takes the newest stamp the database has applied as a high-water mark and runs only what is
 * stamped above it. A migration listed after a newer one but stamped below it is therefore skipped by
 * every database that ran the newer one first, with no error. Two branches each adding a migration
 * produce exactly this on merge, whichever was generated first.
 *
 * @param entries - The journal's entries, in the order they are listed.
 * @param known - Tags already out of order when this was checked for, which cannot be restamped now
 *   because databases have applied them under the stamps they carry.
 * @returns The tags stamped no later than the newest stamp before them, apart from the known ones.
 */
const findOutOfOrderMigrations = (
  entries: readonly JournalEntry[],
  known: readonly string[] = [],
): string[] => {
  const found: string[] = [];
  let newest = Number.NEGATIVE_INFINITY;

  for (const entry of entries) {
    if (entry.when <= newest && !known.includes(entry.tag)) {
      found.push(entry.tag);
    }

    newest = Math.max(newest, entry.when);
  }

  return found;
};

export type { JournalEntry };

export { findOutOfOrderMigrations };
