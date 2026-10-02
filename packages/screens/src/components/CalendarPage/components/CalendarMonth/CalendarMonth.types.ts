import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarMonthProps = {
  day: string;
  today: string;
  entries: readonly CalendarEntry[];
  onOpen: (entry: CalendarEntry) => void;
  onOpenWeek: (day: string) => void;
};

export type { CalendarMonthProps };
