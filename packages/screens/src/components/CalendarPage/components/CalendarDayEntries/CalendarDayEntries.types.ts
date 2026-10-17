import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarDayEntriesProps = {
  entries: readonly CalendarEntry[];
  wait: number;
  onOpen: (entry: CalendarEntry) => void;
};

export type { CalendarDayEntriesProps };
