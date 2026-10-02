import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { fetchReleaseCalendar } from '@ValenceClient/calendar/fetchReleaseCalendar';
import type { CalendarAudience } from '@ValenceContracts/schemas/ReleaseCalendar';

const CALENDAR = ['calendar'] as const;

const TEN_MINUTES_MS = 10 * 60 * 1000;

/**
 * What is released between two days, and for whom.
 *
 * Kept ten minutes, since air dates move rarely and the catalogue behind them is itself kept for
 * hours, and the previous days are kept on screen while the next ones load, so turning a month does
 * not blank the calendar.
 *
 * @param from - The first day, as YYYY-MM-DD.
 * @param to - The last day, as YYYY-MM-DD.
 * @param who - The viewer's own requests or everybody's.
 * @returns The query.
 */
const releases = (from: string, to: string, who: CalendarAudience) =>
  queryOptions({
    queryKey: [...CALENDAR, from, to, who],
    queryFn: () => fetchReleaseCalendar(from, to, who),
    staleTime: TEN_MINUTES_MS,
    placeholderData: keepPreviousData,
  });

const calendarQueries = { key: CALENDAR, releases };

export { calendarQueries };
