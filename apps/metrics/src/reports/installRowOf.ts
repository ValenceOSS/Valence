import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';
import type { installs } from '@ValenceMetrics/db/Schema';

type InstallRow = Omit<typeof installs.$inferInsert, 'firstSeen' | 'lastSeen'>;

/**
 * Lays a report out as the columns an install is grouped by, beside the whole report as it came.
 *
 * @param report - The report, already checked against the contract.
 * @returns The install's columns, all but when it was seen.
 */
const installRowOf = (report: TelemetryReport): InstallRow => ({
  installId: report.installId,
  report,
  version: report.version,
  installMethod: report.installMethod,
  platform: report.os.platform,
  arch: report.os.arch,
  cpuModel: report.cpu.model.trim(),
  cores: report.cpu.cores,
  memoryGb: report.memoryGb,
  database: report.database,
  gpus: report.gpus,
  accels: report.accels,
  library: report.library,
  clients: report.clients,
});

export type { InstallRow };

export { installRowOf };
