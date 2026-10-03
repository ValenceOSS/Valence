import type { CalendarFeedOwner } from '@ValenceServer/calendarFeed/CalendarFeedOwner';

/**
 * The one value a calendar link's owner is known by, so the database can hold each person to a
 * single link: an account and a face, or an account with no face named as such, which a unique
 * index over two columns would let through more than once wherever the face is empty.
 *
 * @param owner - Whose link it is.
 * @returns The key.
 */
const ownerKeyOf = (owner: CalendarFeedOwner): string =>
  owner.profileId === null
    ? `${owner.accountId}:account`
    : `${owner.accountId}:face:${owner.profileId}`;

export { ownerKeyOf };
