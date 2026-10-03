import { CalendarFeedSchema } from '@ValenceContracts/schemas/CalendarFeed';
import type { CalendarFeed } from '@ValenceContracts/schemas/CalendarFeed';

/**
 * Makes a new link to subscribe to the release calendar by, stopping the old one at once, for a
 * link that has been shared or lost.
 *
 * @returns The link, or null where the server refused or could not be reached.
 */
const renewCalendarFeed = async (): Promise<CalendarFeed | null> => {
  const response = await fetch('/api/calendar/feed/renew', {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  const read = CalendarFeedSchema.safeParse(await response.json().catch(() => null));

  return read.success ? read.data : null;
};

export { renewCalendarFeed };
