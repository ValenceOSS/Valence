import { lt } from 'drizzle-orm';
import type { MetricsDatabase } from '@ValenceMetrics/db/MetricsDatabase';
import { installs } from '@ValenceMetrics/db/Schema';

const A_YEAR = 365 * 24 * 60 * 60 * 1000;

/**
 * Deletes every install not heard from in a year, and with it each day it was counted.
 *
 * @param db - Where the reports are kept.
 * @param now - The moment a year is counted back from.
 * @returns How many installs were forgotten.
 */
const forgetQuietInstalls = async (db: MetricsDatabase, now: Date): Promise<number> => {
  const forgotten = await db
    .delete(installs)
    .where(lt(installs.lastSeen, new Date(now.getTime() - A_YEAR)))
    .returning({ installId: installs.installId });

  return forgotten.length;
};

export { A_YEAR, forgetQuietInstalls };
