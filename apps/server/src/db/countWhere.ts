import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

/**
 * Counts the rows of a group for which a condition holds — Postgres's `count(*) filter (where …)`,
 * written so every database runs it. A group with none counts 0 rather than NULL.
 *
 * @param condition - Which rows to count.
 * @returns The count.
 */
const countWhere = (condition: SQL): SQL<number> =>
  sql<number>`coalesce(sum(case when ${condition} then 1 else 0 end), 0)`.mapWith(Number);

export { countWhere };
