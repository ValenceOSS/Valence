import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type ACalendarEntryProps = {
  entry: CalendarEntry;
  onOpen: (entry: CalendarEntry) => void;
};

export type { ACalendarEntryProps };
