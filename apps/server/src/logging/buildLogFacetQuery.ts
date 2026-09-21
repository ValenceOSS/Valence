import { and, desc, isNotNull, sql } from 'drizzle-orm';
import { logRecord } from '@ValenceServer/db/Schema';
import { logFilterFor } from './logFilterFor';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { LogFilters } from './logFilterFor';

const TOP = 10;

/**
 * Builds the query that finds which values of one field the matching records carry most often,
 * without running it — the "top components" beside a graph of the same records.
 *
 * Counted in events rather than rows, so a line that repeated four thousand times ranks as the four
 * thousand it was.
 *
 * @param db - The database to query.
 * @param filters - What the counted records are filtered by.
 * @param field - Which column to rank the values of.
 * @returns The select query, ready to be awaited.
 */
const buildLogFacetQuery = (
  db: ValenceDatabase,
  filters: LogFilters,
  field: typeof logRecord.source | typeof logRecord.jobKind,
) => {
  const events = sql<number>`sum(${logRecord.count})`;

  return db
    .select({ value: field, events: events.mapWith(Number) })
    .from(logRecord)
    .where(and(logFilterFor(filters), isNotNull(field)))
    .groupBy(field)
    .orderBy(desc(events))
    .limit(TOP);
};

export { buildLogFacetQuery };
