import { CALENDAR_VIEWS } from '@ValenceScreens/calendar/CALENDAR_VIEWS';
import type { CalendarView } from '@ValenceScreens/calendar/CALENDAR_VIEWS';

/**
 * Which view of the calendar an address asks for, the month where it asks for none or for one that
 * does not exist.
 *
 * @param asked - What the address says.
 * @returns The view to show.
 */
const calendarViewShown = (asked: string | null): CalendarView =>
  CALENDAR_VIEWS.find((view) => view === asked) ?? 'month';

export { calendarViewShown };
