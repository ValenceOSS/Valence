import { say } from '@ValenceI18n/say';

type LogRangeId = '15m' | '1h' | '6h' | '24h' | '7d' | 'all';

type LogRange = { id: LogRangeId; label: string; ms: number | null };

const LOG_RANGES: readonly LogRange[] = [
  { id: '15m', label: say('client.admin.logRanges.last15Minutes'), ms: 15 * 60_000 },
  { id: '1h', label: say('client.admin.logRanges.lastHour'), ms: 3_600_000 },
  { id: '6h', label: say('client.admin.logRanges.last6Hours'), ms: 6 * 3_600_000 },
  { id: '24h', label: say('client.admin.logRanges.last24Hours'), ms: 86_400_000 },
  { id: '7d', label: say('client.admin.logRanges.last7Days'), ms: 7 * 86_400_000 },
  { id: 'all', label: say('client.admin.logRanges.everythingKept'), ms: null },
];

/**
 * When a range of the log begins.
 *
 * @param range - Which range.
 * @param nowMs - The present moment.
 * @returns The earliest a record may be, or nothing for a range that has no start.
 */
const logRangeStart = (range: LogRangeId, nowMs: number): number | null => {
  const found = LOG_RANGES.find((one) => one.id === range);

  return found?.ms === undefined || found.ms === null ? null : nowMs - found.ms;
};

export type { LogRange, LogRangeId };

export { LOG_RANGES, logRangeStart };
