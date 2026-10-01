import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * Measures the time from one moment to a later one, in milliseconds.
 *
 * @param later - The later moment.
 * @param earlier - The earlier moment.
 * @returns How many milliseconds lie between them.
 */
const millisecondsBetween = (later: Column | SQL, earlier: Column | SQL): SQL<number> =>
  sql<number>`(timestampdiff(microsecond, ${earlier}, ${later}) / 1000)`.mapWith(Number);

export { millisecondsBetween };
