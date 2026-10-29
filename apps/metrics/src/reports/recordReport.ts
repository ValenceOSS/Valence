import { lte } from 'drizzle-orm';
import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';
import type { MetricsDatabase } from '@ValenceMetrics/db/MetricsDatabase';
import { dailyInstalls, installs } from '@ValenceMetrics/db/Schema';
import { installRowOf } from './installRowOf';

const AN_HOUR = 60 * 60 * 1000;

type RecordOutcome = 'recorded' | 'tooSoon';

/**
 * Keeps a report as its install's latest and counts the install as seen today, unless the same
 * install already reported within the hour, in which case nothing changes.
 *
 * @param db - Where the reports are kept.
 * @param report - The report, already checked against the contract.
 * @param now - When it arrived.
 * @returns Whether it was kept or came too soon after the last.
 */
const recordReport = async (
  db: MetricsDatabase,
  report: TelemetryReport,
  now: Date,
): Promise<RecordOutcome> => {
  const row = installRowOf(report);
  const anHourAgo = new Date(now.getTime() - AN_HOUR);

  return db.transaction(async (tx) => {
    const kept = await tx
      .insert(installs)
      .values({ ...row, firstSeen: now, lastSeen: now })
      .onConflictDoUpdate({
        target: installs.installId,
        set: { ...row, lastSeen: now },
        setWhere: lte(installs.lastSeen, anHourAgo),
      })
      .returning({ installId: installs.installId });

    if (kept.length === 0) {
      return 'tooSoon';
    }

    await tx
      .insert(dailyInstalls)
      .values({
        day: now.toISOString().slice(0, 10),
        installId: row.installId,
        version: row.version,
      })
      .onConflictDoUpdate({
        target: [dailyInstalls.day, dailyInstalls.installId],
        set: { version: row.version },
      });

    return 'recorded';
  });
};

export type { RecordOutcome };

export { AN_HOUR, recordReport };
