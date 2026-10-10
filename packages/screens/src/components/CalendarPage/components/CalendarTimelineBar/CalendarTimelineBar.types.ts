import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { CalendarTimelineRow } from '@ValenceScreens/calendar/CalendarTimelineRow';

type CalendarTimelineBarProps = {
  row: CalendarTimelineRow;
  today: string;
  isLeaning: boolean;
  isStill: boolean;
  delay: number;
  gridColumn: string;
  gridRow: number;
  onOpen: (entry: CalendarEntry) => void;
};

export type { CalendarTimelineBarProps };
