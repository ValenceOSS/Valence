import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarPageProps = {
  onOpen: (entry: CalendarEntry) => void;
  onLight: (path: string | null) => void;
};

export type { CalendarPageProps };
