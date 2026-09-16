import { and, isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { createDatabase } from '@ValenceServer/db/Database';
import { mediaItem } from '@ValenceServer/db/Schema';
import type { ValenceDatabase } from '@ValenceServer/db/Database';

const NOWHERE = 'postgres://nobody@localhost:1/none';

/**
 * Builds a list of media narrowed by a visibility condition and reads back the SQL, without running
 * it.
 *
 * A pool connects at its first query and this never makes one, so these conditions can be read on a
 * machine with no Postgres. What matters about them is the text: each is a subquery over a different
 * table that has to refer back to the row outside it, and a subquery that fails to correlate is
 * still valid SQL — it simply answers the same thing for every row, quietly, which is how a filter
 * comes to remove everything or nothing at all.
 *
 * @param build - Given the database, and asked for the condition under test.
 * @returns The SQL of a query narrowed by it.
 */
const narrowedForTest = (build: (db: ValenceDatabase) => SQL | undefined): string => {
  const { db } = createDatabase(NOWHERE);

  return db
    .select({ id: mediaItem.id })
    .from(mediaItem)
    .where(and(isNull(mediaItem.extraKind), build(db)))
    .toSQL().sql;
};

export { narrowedForTest };
