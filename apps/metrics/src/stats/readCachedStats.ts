import { openDatabase } from '@ValenceMetrics/db/openDatabase';
import { readStats } from './readStats';
import type { MetricsStats } from './MetricsStats';

const FRESH_FOR = 5 * 60 * 1000;

let cached: { at: number; stats: Promise<MetricsStats> } | null = null;

/**
 * Reads the figures at most once every five minutes, handing back the last reading in between,
 * and reading again straight away where the last attempt failed.
 *
 * @param now - When this is.
 * @returns The figures.
 */
const readCachedStats = (now: Date = new Date()): Promise<MetricsStats> => {
  if (cached !== null && now.getTime() - cached.at < FRESH_FOR) {
    return cached.stats;
  }

  const stats = readStats(openDatabase(), now);
  const reading = { at: now.getTime(), stats };

  cached = reading;

  stats.catch(() => {
    if (cached === reading) {
      cached = null;
    }
  });

  return stats;
};

export { FRESH_FOR, readCachedStats };
