const CALENDAR_VIEWS = ['timeline', 'month', 'week', 'upcoming'] as const;

type CalendarView = (typeof CALENDAR_VIEWS)[number];

export type { CalendarView };

export { CALENDAR_VIEWS };
