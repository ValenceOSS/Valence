import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarTimelineProps = {
  day: string;
  today: string;
  entries: readonly CalendarEntry[];
  onOpen: (entry: CalendarEntry) => void;
};

export type { CalendarTimelineProps };
