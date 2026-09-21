import { sql } from 'drizzle-orm';
import { logRecord } from '@ValenceServer/db/Schema';
import { logFilterFor } from './logFilterFor';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { LogFilters } from './logFilterFor';

/**
 * Builds the query that counts how many events there were at each level in each stretch of time,
 * without running it.
 *
 * A record that repeated is counted as often as it repeated: the flood is exactly what a graph
 * over time exists to show, and one row standing for four thousand events would hide it.
 *
 * @param db - The database to query.
 * @param filters - What the counted records are filtered by, including the time range.
 * @param bucketMs - How wide each stretch of time is, written into the query as the whole number
 *   it is so that the grouping and the selecting are the same expression to the database.
 * @returns The select query, ready to be awaited.
 */
const buildLogHistogramQuery = (db: ValenceDatabase, filters: LogFilters, bucketMs: number) => {
  const width = sql.raw(String(Math.max(1, Math.trunc(bucketMs))));
  const bucket = sql<number>`floor(extract(epoch from ${logRecord.at}) * 1000 / ${width})`;

  return db
    .select({
      bucket: bucket.mapWith(Number),
      level: logRecord.level,
      events: sql<number>`sum(${logRecord.count})`.mapWith(Number),
    })
    .from(logRecord)
    .where(logFilterFor(filters))
    .groupBy(bucket, logRecord.level);
};

export { buildLogHistogramQuery };
