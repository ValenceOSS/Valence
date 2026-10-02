import { readFromServer } from '@ValenceClient/query/readFromServer';
import { ReleaseCalendarSchema } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { CalendarAudience, CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

/**
 * Reads what is released between two days: episodes of shows in the library, and requested films
 * and episodes.
 *
 * @param from - The first day, as YYYY-MM-DD.
 * @param to - The last day, as YYYY-MM-DD.
 * @param who - Whether to show the viewer's own requests or everybody's, where they may see them.
 * @returns Every entry, in the order the days fall.
 */
const fetchReleaseCalendar = async (
  from: string,
  to: string,
  who: CalendarAudience,
): Promise<CalendarEntry[]> => {
  const query = new URLSearchParams({ from, to, who });

  return (await readFromServer(`/api/calendar?${query.toString()}`, ReleaseCalendarSchema)).entries;
};

export { fetchReleaseCalendar };
