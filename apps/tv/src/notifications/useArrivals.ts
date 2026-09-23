import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { markNotificationsRead } from '@ValenceClient/notifications/fetchNotifications';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import type { Notification } from '@ValenceContracts/schemas/Notification';

/**
 * The newest thing this viewer asked for that has arrived since the app opened, to be announced.
 *
 * The inbox is read again whenever the server's socket says a notice has come, so an arrival shows
 * the moment it lands. Whatever was already in the inbox when the app opened is not announced — it
 * is old news — and each arrival is announced once, marked read as it is.
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

    if (seen.current === null) {
      seen.current = new Set(notices.map((notice) => notice.id));

      return;
    }

    const known = seen.current;
    const fresh = notices.find(
      (notice) =>
        !known.has(notice.id) && notice.event === 'requests.available' && notice.readAt === null,
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
