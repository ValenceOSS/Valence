import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarMonthNarrowProps = {
  day: string;
  today: string;
  entries: readonly CalendarEntry[];
  onOpen: (entry: CalendarEntry) => void;
  onPick: (day: string) => void;
};

export type { CalendarMonthNarrowProps };
