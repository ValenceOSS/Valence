import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarEntryRowProps = {
  entry: CalendarEntry;
  onOpen: (entry: CalendarEntry) => void;
  isCompact?: boolean;
};

export type { CalendarEntryRowProps };
