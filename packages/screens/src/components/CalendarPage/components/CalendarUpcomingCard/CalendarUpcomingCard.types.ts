import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarUpcomingCardProps = {
  entry: CalendarEntry;
  myId: string | null;
  onOpen: (entry: CalendarEntry) => void;
};

export type { CalendarUpcomingCardProps };
