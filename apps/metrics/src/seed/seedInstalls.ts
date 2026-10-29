import type { MetricsDatabase } from '@ValenceMetrics/db/MetricsDatabase';
import { dailyInstalls, installs } from '@ValenceMetrics/db/Schema';
import { installRowOf } from '@ValenceMetrics/reports/installRowOf';
import { A_DAY } from '@ValenceMetrics/stats/A_DAY';
import { fakeReportOf } from './fakeReportOf';

const HISTORY_DAYS = 120;

/**
 * Makes a version 4 uuid from a source of random numbers, so the same seed makes the same ids.
 *
 * @param random - Where the chance comes from.
 * @returns The id.
 */
const uuidOf = (random: () => number): string => {
  const hex = Array.from({ length: 32 }, () => Math.floor(random() * 16).toString(16));

  hex[12] = '4';
  hex[16] = '89ab'.charAt(Math.floor(random() * 4));

  const whole = hex.join('');

  return `${whole.slice(0, 8)}-${whole.slice(8, 12)}-${whole.slice(12, 16)}-${whole.slice(16, 20)}-${whole.slice(20)}`;
};

/**
 * Fills the database with fake installs and a few months of their daily reports, for seeing the
 * page locally with something on it. Running it twice with the same seed changes nothing.
 *
 * @param db - Where the reports are kept.
 * @param now - When this is.
 * @param count - How many installs to make up.
 * @param random - Where the chance comes from.
 * @returns How many daily reports were made up.
 */
const seedInstalls = async (
  db: MetricsDatabase,
  now: Date,
  count: number,
  random: () => number,
): Promise<number> => {
  const today = Math.floor(now.getTime() / A_DAY);
  let days = 0;

  for (let made = 0; made < count; made += 1) {
    const row = installRowOf(fakeReportOf(uuidOf(random), random));
    const firstDay = today - Math.floor(random() * HISTORY_DAYS);
    const lastDay =
      random() < 0.1 ? Math.max(firstDay, today - 31 - Math.floor(random() * 30)) : today;
    const seen = Array.from({ length: lastDay - firstDay + 1 }, (_, at) => firstDay + at).filter(
      (day) => day === lastDay || random() < 0.9,
    );

    await db
      .insert(installs)
      .values({
        ...row,
        firstSeen: new Date(firstDay * A_DAY),
        lastSeen: lastDay === today ? now : new Date(lastDay * A_DAY),
      })
      .onConflictDoNothing();

    await db
      .insert(dailyInstalls)
      .values(
        seen.map((day) => ({
          day: new Date(day * A_DAY).toISOString().slice(0, 10),
          installId: row.installId,
          version: row.version,
        })),
      )
      .onConflictDoNothing();

    days += seen.length;
  }

  return days;
};

export { seedInstalls };
