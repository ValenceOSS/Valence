import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type ACalendarMonthProps = {
  day: string;
  month?: string;
  today: string;
  entries: readonly CalendarEntry[];
  onPick: (day: string) => void;
};

export type { ACalendarMonthProps };
