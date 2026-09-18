import type { BookReading } from '@ValenceContracts/schemas/Book';
import type { Viewing } from '@ValenceContracts/schemas/Viewing';

type HistoryEntry =
  | { kind: 'viewing'; at: Date; viewing: Viewing }
  | { kind: 'reading'; at: Date; reading: BookReading };

/**
 * Puts what somebody watched and what they read into one history, most recent first.
 *
 * What was watched arrives a page at a time and what was read all at once, so while there are older
 * viewings still to come a book read before the oldest one shown is held back: showing it now would
 * put it at the bottom of the list, and then a page later somewhere in the middle of it.
 *
 * @param viewings - What was watched, as far as it has been read.
 * @param readings - What was read, each book once, at the last time it was opened.
 * @param hasMore - Whether older viewings are still to come.
 * @returns The history.
 */
const interleaveHistory = (
  viewings: readonly Viewing[],
  readings: readonly BookReading[],
  hasMore: boolean,
): HistoryEntry[] => {
  const oldest = viewings.reduce<number | null>((was, one) => {
    const at = Date.parse(one.lastWatchedAt);

    return was === null || at < was ? at : was;
  }, null);

  const shownReadings = readings.filter(
    (one) => !hasMore || oldest === null || Date.parse(one.updatedAt) >= oldest,
  );

  return [
    ...viewings.map((viewing) => ({
      kind: 'viewing' as const,
      at: new Date(viewing.lastWatchedAt),
      viewing,
    })),
    ...shownReadings.map((reading) => ({
      kind: 'reading' as const,
      at: new Date(reading.updatedAt),
      reading,
    })),
  ].sort((one, other) => other.at.getTime() - one.at.getTime());
};

export type { HistoryEntry };

export { interleaveHistory };
