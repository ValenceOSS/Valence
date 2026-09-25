import { asc, desc, sql } from 'drizzle-orm';
import { logRecord } from '@ValenceServer/db/Schema';
import { logFilterFor } from './logFilterFor';
import type { SQL } from 'drizzle-orm';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { LogQuery, LogSort } from '@ValenceContracts/schemas/Log';

 
const SEVERITY = sql`case ${logRecord.level} when 'error' then 3 when 'warn' then 2 when 'info' then 1 else 0 end`;

/**
 * What a page of records is ordered by. Ties always fall to the newest first, so a page is stable
 * however many records share what it is sorted on.
 *
 * @param sort - How the operator asked for the records to be ordered.
 * @returns The ordering, from most to least significant.
 */
const orderingFor = (sort: LogSort): SQL[] => {
  switch (sort) {
    case 'oldest':
      return [asc(logRecord.at), asc(logRecord.id)];
    case 'severest':
      return [desc(SEVERITY), desc(logRecord.at), desc(logRecord.id)];
    case 'busiest':
      return [desc(logRecord.count), desc(logRecord.at), desc(logRecord.id)];
    case 'newest':
      return [desc(logRecord.at), desc(logRecord.id)];
  }
};

/**
 * Builds the filtered, ordered and paged selection a log listing reads from, without running it.
 *
 * @param db - The database to query.
 * @param query - What to filter, order and page the listing by.
 * @returns The select query, ready to be awaited.
 */
const buildLogReadQuery = (db: ValenceDatabase, query: LogQuery) =>
  db
    .select()
    .from(logRecord)
    .where(logFilterFor(query))
    .orderBy(...orderingFor(query.sort))
    .limit(query.limit)
    .offset(query.offset);

export { buildLogReadQuery };
