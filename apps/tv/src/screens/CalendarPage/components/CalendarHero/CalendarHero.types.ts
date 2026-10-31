import type { ReactNode } from 'react';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

type CalendarHeroProps = {
  entry: CalendarEntry | null;
  today: string;
  children?: ReactNode;
};

export type { CalendarHeroProps };
