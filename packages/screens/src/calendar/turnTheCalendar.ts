import { addDays } from '@ValenceCore/functions/addDays';
import type { CalendarView } from '@ValenceScreens/calendar/CALENDAR_VIEWS';

const TIMELINE_TURN_DAYS = 28;

/**
 * The day a calendar is turned to after moving one page back or on: a month at a time in the month
 * view, four weeks at a time in the timeline, a week at a time otherwise.
 *
 * @param view - The view.
 * @param day - The day it is turned to now.
 * @param pages - How many pages on, or back where negative.
 * @returns The day it is turned to after.
 */
const turnTheCalendar = (view: CalendarView, day: string, pages: number): string => {
  if (view === 'timeline') {
    return addDays(day, pages * TIMELINE_TURN_DAYS);
  }

  if (view !== 'month') {
    return addDays(day, pages * 7);
  }

  const month = Number(day.slice(0, 4)) * 12 + Number(day.slice(5, 7)) - 1 + pages;

  return [
    Math.floor(month / 12)
      .toString()
      .padStart(4, '0'),
    ((month % 12) + 1).toString().padStart(2, '0'),
    '01',
  ].join('-');
};

export { turnTheCalendar };
