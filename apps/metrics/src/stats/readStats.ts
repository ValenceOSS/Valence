import type { MetricsDatabase } from '@ValenceMetrics/db/MetricsDatabase';
import { A_DAY } from './A_DAY';
import { aggregateInstalls } from './aggregateInstalls';
import { ACTIVE_WINDOW_DAYS, readActiveTrend } from './readActiveTrend';
import { readInstallSummaries } from './readInstallSummaries';
import type { MetricsStats } from './MetricsStats';

const TREND_DAYS = 90;

/**
 * Reads every install active in the last thirty days, and how that number has moved, and sums
 * them up into the figures the page shows.
 *
 * @param db - Where the reports are kept.
 * @param now - When this is.
 * @returns The figures.
 */
const readStats = async (db: MetricsDatabase, now: Date): Promise<MetricsStats> => {
  const [installs, trend] = await Promise.all([
    readInstallSummaries(db, new Date(now.getTime() - ACTIVE_WINDOW_DAYS * A_DAY)),
    readActiveTrend(db, now.toISOString().slice(0, 10), TREND_DAYS),
  ]);

  return aggregateInstalls({ installs, trend, now });
};

export { TREND_DAYS, readStats };
