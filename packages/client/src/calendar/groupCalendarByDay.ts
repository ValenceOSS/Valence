import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarDay = { date: string; entries: CalendarEntry[] };

/**
 * Gathers entries under the day each falls on, the days in order and each keeping the order its
 * entries came in.
 *
 * @param entries - The entries, in any order.
 * @returns One group a day that has anything on it.
 */
const groupCalendarByDay = (entries: readonly CalendarEntry[]): CalendarDay[] => {
  const days = new Map<string, CalendarEntry[]>();

  for (const entry of entries) {
    days.set(entry.date, [...(days.get(entry.date) ?? []), entry]);
  }

  return [...days.entries()]
    .sort(([one], [other]) => one.localeCompare(other))
    .map(([date, onIt]) => ({ date, entries: onIt }));
};

export type { CalendarDay };

export { groupCalendarByDay };
