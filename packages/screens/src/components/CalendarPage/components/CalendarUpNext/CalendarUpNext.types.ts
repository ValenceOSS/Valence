import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarUpNextProps = {
  entries: readonly CalendarEntry[];
  today: string;
  onOpen: (entry: CalendarEntry) => void;
};

export type { CalendarUpNextProps };
