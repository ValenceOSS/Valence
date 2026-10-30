import { readPartyInvitation } from '@ValenceClient/party/readPartyInvitation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { markNotificationsRead } from '@ValenceClient/notifications/fetchNotifications';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import type { Notification } from '@ValenceContracts/schemas/Notification';

const INVITATIONS_LAST_MS = 10 * 60_000;

/**
 * Whether a notice is an invitation into a party recent enough to join, as one an hour old is not.
 *
 * @param notice - The notice.
 * @param now - The time now, in milliseconds.
 * @returns Whether it is.
 */
const isALiveInvitation = (notice: Notification, now: number): boolean =>
  readPartyInvitation(notice.link) !== null &&
  now - Date.parse(notice.createdAt) < INVITATIONS_LAST_MS;

/**
 * The newest thing this viewer asked for that has arrived since the app opened, to be announced, or
 * an invitation into a party that is still worth joining.
 *
 * The inbox is read again whenever the server's socket says a notice has come, so an arrival shows
 * the moment it lands. Whatever was already in the inbox when the app opened is not announced — it
 * is old news — except an unread invitation from the last few minutes, since somebody may have
 * opened the app to answer it; an invitation older than that is left alone, as its party has likely
 * moved on. Each is announced once, marked read as it is.
 *
 * @returns The arrival to announce, or nothing, and how to put it away.
 */
const useArrivals = (): { arrival: Notification | null; dismiss: () => void } => {
  const inbox = useQuery(notificationQueries.inbox());
  const seen = useRef<Set<string> | null>(null);
  const [arrival, setArrival] = useState<Notification | null>(null);

  useEffect(() => {
    const notices = inbox.data?.notifications;

    if (notices === undefined) {
      return;
    }

    const now = Date.now();

    if (seen.current === null) {
      seen.current = new Set(
        notices
          .filter((notice) => notice.readAt !== null || !isALiveInvitation(notice, now))
          .map((notice) => notice.id),
      );
    }

    const known = seen.current;
    const fresh = notices.find(
      (notice) =>
        !known.has(notice.id) &&
        notice.readAt === null &&
        (notice.event === 'requests.available' || isALiveInvitation(notice, now)),
    );

    for (const notice of notices) {
      known.add(notice.id);
    }

    if (fresh !== undefined) {
      setArrival(fresh);
      void markNotificationsRead(fresh.id);
    }
  }, [inbox.data]);

  const dismiss = useCallback(() => {
    setArrival(null);
  }, []);

  return { arrival, dismiss };
};

export { useArrivals };
