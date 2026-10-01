import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * Reads a moment as milliseconds since 1970, as JavaScript counts time, which is correct because
 * every timestamp is stored in UTC and the session's time zone is UTC.
 *
 * @param moment - The moment.
 * @returns Its milliseconds since the epoch.
 */
const epochMilliseconds = (moment: Column | SQL): SQL<number> =>
  sql<number>`(unix_timestamp(${moment}) * 1000)`.mapWith(Number);

export { epochMilliseconds };
