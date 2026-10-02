import type { FilterGroup } from '@ValenceUI/FilterMenu.types';
import type { CalendarView } from '@ValenceScreens/calendar/CALENDAR_VIEWS';

type CalendarToolbarProps = {
  view: CalendarView;
  day: string;
  today: string;
  filters: readonly FilterGroup[];
  selected: ReadonlySet<string>;
  onView: (view: CalendarView) => void;
  onTurn: (pages: number) => void;
  onPickDay: (day: string) => void;
  onFilter: (selected: ReadonlySet<string>) => void;
};

export type { CalendarToolbarProps };
