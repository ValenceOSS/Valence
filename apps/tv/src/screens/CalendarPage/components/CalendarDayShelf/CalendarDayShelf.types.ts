import type { CalendarDay } from '@ValenceClient/calendar/groupCalendarByDay';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarDayShelfProps = {
  day: CalendarDay;
  name: string;
  isFirst: boolean;
  onFocus: (entry: CalendarEntry) => void;
  onOpen: (entry: CalendarEntry) => void;
};

export type { CalendarDayShelfProps };
