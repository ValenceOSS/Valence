import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarUpcomingProps = {
  entries: readonly CalendarEntry[];
  today: string;
  onOpen: (entry: CalendarEntry) => void;
};

export type { CalendarUpcomingProps };
