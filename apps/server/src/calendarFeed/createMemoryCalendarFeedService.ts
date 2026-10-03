import { makeShareToken } from '@ValenceServer/sharing/shareToken';
import type { CalendarFeed } from '@ValenceContracts/schemas/CalendarFeed';
import type { CalendarFeedOwner } from '@ValenceServer/calendarFeed/CalendarFeedOwner';
import type { CalendarFeedService } from '@ValenceServer/calendarFeed/CalendarFeedService';

type Held = CalendarFeedOwner & {
  token: string;
  createdAt: string;
  lastReadAt: string | null;
};

/**
 * The links people subscribe to the release calendar by, held in memory, for tests and for a
 * server run without a database. Like the database's, each person has at most one.
 *
 * @param now - What time it is, for when a link was made and last read.
 * @returns The service.
 */
const createMemoryCalendarFeedService = (
  now: () => Date = () => new Date(),
): CalendarFeedService => {
  const feeds: Held[] = [];

  const indexOf = (owner: CalendarFeedOwner) =>
    feeds.findIndex(
      (feed) => feed.accountId === owner.accountId && feed.profileId === owner.profileId,
    );

  const shown = (held: Held): CalendarFeed => ({
    token: held.token,
    createdAt: held.createdAt,
    lastReadAt: held.lastReadAt,
  });

  const renew = (owner: CalendarFeedOwner): Promise<CalendarFeed> => {
    const at = indexOf(owner);

    if (at >= 0) {
      feeds.splice(at, 1);
    }

    const held = {
      ...owner,
      token: makeShareToken(),
      createdAt: now().toISOString(),
      lastReadAt: null,
    };

    feeds.push(held);

    return Promise.resolve(shown(held));
  };

  return {
    read: (owner) => {
      const held = feeds[indexOf(owner)];

      return Promise.resolve(held === undefined ? null : shown(held));
    },

    ensure: (owner) => {
      const held = feeds[indexOf(owner)];

      return held === undefined ? renew(owner) : Promise.resolve(shown(held));
    },

    renew,

    stop: (owner) => {
      const at = indexOf(owner);

      if (at >= 0) {
        feeds.splice(at, 1);
      }

      return Promise.resolve(at >= 0);
    },

    resolve: (token) => {
      const held = feeds.find((feed) => feed.token === token);

      if (held === undefined) {
        return Promise.resolve(null);
      }

      held.lastReadAt = now().toISOString();

      return Promise.resolve({ accountId: held.accountId, profileId: held.profileId });
    },
  };
};

export { createMemoryCalendarFeedService };
