import type { Me } from '@ValenceContracts/functions/isMyAsk';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarUpcomingCardProps = {
  entry: CalendarEntry;
  me: Me | null;
  onOpen: (entry: CalendarEntry) => void;
};

export type { CalendarUpcomingCardProps };
