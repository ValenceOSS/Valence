import type { CalendarFeed } from '@ValenceContracts/schemas/CalendarFeed';
import type { CalendarFeedOwner } from '@ValenceServer/calendarFeed/CalendarFeedOwner';

type CalendarFeedService = {
  read: (owner: CalendarFeedOwner) => Promise<CalendarFeed | null>;
  ensure: (owner: CalendarFeedOwner) => Promise<CalendarFeed>;
  renew: (owner: CalendarFeedOwner) => Promise<CalendarFeed>;
  stop: (owner: CalendarFeedOwner) => Promise<boolean>;
  resolve: (token: string) => Promise<CalendarFeedOwner | null>;
};

export type { CalendarFeedService };
