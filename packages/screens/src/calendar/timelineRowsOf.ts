import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';
import { timelineRowKeyOf } from '@ValenceScreens/calendar/timelineRowKeyOf';
import type { CalendarTimelineRow } from '@ValenceScreens/calendar/CalendarTimelineRow';

/**
 * The rows of the calendar's timeline: one for each show or film, running from its first release
 * shown to its last, the soonest to start first.
 *
 * @param entries - What is released in the days shown.
 * @returns The rows, in order.
 */
const timelineRowsOf = (entries: readonly CalendarEntry[]): CalendarTimelineRow[] => {
  const rows = new Map<string, CalendarEntry[]>();

  for (const entry of entries) {
    const key = timelineRowKeyOf(entry);
    const held = rows.get(key) ?? [];

    if (!held.some((known) => known.id === entry.id)) {
      rows.set(key, [...held, entry]);
    }
  }

  return [...rows.entries()]
    .map(([key, held]) => {
      const sorted = [...held].sort((a, b) => a.date.localeCompare(b.date));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      return {
        key,
        title: first?.title ?? '',
        entries: sorted,
        first: first?.date ?? '',
        last: last?.date ?? '',
      };
    })
    .sort((a, b) => a.first.localeCompare(b.first) || a.title.localeCompare(b.title));
};

export { timelineRowsOf };
