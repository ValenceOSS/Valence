import { addDays } from '@ValenceCore/functions/addDays';
import { monthGridOf } from '@ValenceCore/functions/monthGridOf';
import { startOfWeek } from '@ValenceCore/functions/startOfWeek';
import { timelineDaysOf } from '@ValenceScreens/calendar/timelineDaysOf';
import type { CalendarView } from '@ValenceScreens/calendar/CALENDAR_VIEWS';

const UPCOMING_DAYS = 60;

/**
 * The first and last days a view of the calendar shows.
 *
 * The timeline shows its five weeks. A month shows its whole grid, the days either side of it included, since they are drawn. The
 * upcoming list always starts today, wherever the calendar was turned to.
 *
 * @param view - The view.
 * @param day - The day the calendar is turned to.
 * @param today - Today.
 * @returns The span, every day as YYYY-MM-DD.
 */
const daysShownIn = (
  view: CalendarView,
  day: string,
  today: string,
): { from: string; to: string } => {
  switch (view) {
    case 'timeline': {
      const days = timelineDaysOf(day);

      return { from: days[0] ?? day, to: days[days.length - 1] ?? day };
    }
    case 'month': {
      const grid = monthGridOf(day);

      return { from: grid[0] ?? day, to: grid[grid.length - 1] ?? day };
    }
    case 'week': {
      const first = startOfWeek(day);

      return { from: first, to: addDays(first, 6) };
    }
    case 'upcoming':
      return { from: today, to: addDays(today, UPCOMING_DAYS - 1) };
  }
};

export { daysShownIn };
