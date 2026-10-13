import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarTimelineRow = {
  key: string;
  title: string;
  entries: readonly CalendarEntry[];
  first: string;
  last: string;
};

export type { CalendarTimelineRow };
