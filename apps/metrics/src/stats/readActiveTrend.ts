import { sql } from 'drizzle-orm';
import type { MetricsDatabase } from '@ValenceMetrics/db/MetricsDatabase';
import type { DayCount } from './MetricsStats';

const ACTIVE_WINDOW_DAYS = 30;

/**
 * Counts, for each of the last so many days, how many installs had reported in the thirty days up
 * to and including it.
 *
 * @param db - Where the reports are kept.
 * @param today - The last day to count, as `YYYY-MM-DD`.
 * @param days - How many days to count back over.
 * @returns One count per day, oldest first.
 */
const readActiveTrend = (db: MetricsDatabase, today: string, days: number): Promise<DayCount[]> =>
  db
    .select({
      day: sql<string>`to_char(counted.day, 'YYYY-MM-DD')`,
      installs: sql<number>`(
        select count(distinct seen.install_id)::int
        from daily_installs seen
        where seen.day > counted.day - ${ACTIVE_WINDOW_DAYS}::int
          and seen.day <= counted.day
      )`.mapWith(Number),
    })
    .from(
      sql`(
        select series::date as day
        from generate_series(
          ${today}::date - ${days - 1}::int,
          ${today}::date,
          interval '1 day'
        ) as series
      ) as counted`,
    )
    .orderBy(sql`counted.day`);

export { ACTIVE_WINDOW_DAYS, readActiveTrend };
