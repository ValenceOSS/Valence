import { CalendarFeedSchema } from '@ValenceContracts/schemas/CalendarFeed';
import type { CalendarFeed } from '@ValenceContracts/schemas/CalendarFeed';

/**
 * Asks for the link the person signed in subscribes to the release calendar by, making one where
 * they have none. It is the same link every time it is asked for, until a new one is made.
 *
 * @returns The link, or null where the server refused or could not be reached.
 */
const ensureCalendarFeed = async (): Promise<CalendarFeed | null> => {
  const response = await fetch('/api/calendar/feed', {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  const read = CalendarFeedSchema.safeParse(await response.json().catch(() => null));

  return read.success ? read.data : null;
};

export { ensureCalendarFeed };
