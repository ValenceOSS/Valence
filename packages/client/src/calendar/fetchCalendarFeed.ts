import { readFromServer } from '@ValenceClient/query/readFromServer';
import { CalendarFeedStatusSchema } from '@ValenceContracts/schemas/CalendarFeed';
import type { CalendarFeed } from '@ValenceContracts/schemas/CalendarFeed';

/**
 * Reads whether the person signed in has a link to subscribe to the release calendar by: when it
 * was made and when a calendar app last read it. The link itself is never read back.
 *
 * @returns Their link, or null where they have none.
 */
const fetchCalendarFeed = async (): Promise<CalendarFeed | null> =>
  (await readFromServer('/api/calendar/feed', CalendarFeedStatusSchema)).feed;

export { fetchCalendarFeed };
