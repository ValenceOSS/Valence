import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarCardProps = {
  entry: CalendarEntry;
  hasPreferredFocus: boolean;
  onFocus: (entry: CalendarEntry) => void;
  onPress: (entry: CalendarEntry) => void;
};

export type { CalendarCardProps };
