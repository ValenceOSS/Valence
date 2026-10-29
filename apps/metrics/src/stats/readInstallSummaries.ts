import { gte } from 'drizzle-orm';
import type { MetricsDatabase } from '@ValenceMetrics/db/MetricsDatabase';
import { installs } from '@ValenceMetrics/db/Schema';
import type { InstallSummary } from './InstallSummary';

/**
 * Reads what every install that has reported since a given moment last said about itself, in the
 * columns it is grouped by.
 *
 * @param db - Where the reports are kept.
 * @param since - The earliest last report to count.
 * @returns One summary per install.
 */
const readInstallSummaries = (db: MetricsDatabase, since: Date): Promise<InstallSummary[]> =>
  db
    .select({
      lastSeen: installs.lastSeen,
      version: installs.version,
      installMethod: installs.installMethod,
      platform: installs.platform,
      arch: installs.arch,
      cpuModel: installs.cpuModel,
      cores: installs.cores,
      memoryGb: installs.memoryGb,
      database: installs.database,
      gpus: installs.gpus,
      accels: installs.accels,
      library: installs.library,
      clients: installs.clients,
    })
    .from(installs)
    .where(gte(installs.lastSeen, since));

export { readInstallSummaries };
