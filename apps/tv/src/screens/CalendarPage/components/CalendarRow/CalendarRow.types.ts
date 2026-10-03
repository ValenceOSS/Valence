import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarRowProps = {
  entry: CalendarEntry;
  hasPreferredFocus: boolean;
  onPress: (entry: CalendarEntry) => void;
};

export type { CalendarRowProps };
