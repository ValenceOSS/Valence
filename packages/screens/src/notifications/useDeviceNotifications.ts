import { sayAgain } from '@ValenceI18n/sayAgain';
import { useEffect, useRef } from 'react';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { noticeOnThisDevice } from '@ValenceClient/notifications/noticeOnThisDevice';
import type { Notification } from '@ValenceClient/notifications/fetchNotifications';

type DeviceNotifications = {
  isKnown: boolean;
  notifications: Notification[];
  unread: number;
  onOpen: (notification: Notification) => void;
};

/**
 * Puts what arrives on the bell up on this machine too, the way a chat client does, and keeps the
 * icon's own badge honest about how many are unread.
 *
 * The bell already has the notice: it is a row in the inbox the moment the server sends it. What it
 * cannot do is reach outside the page, which is a browser's whole idea of itself — so this is where
 * that reach is asked for, through the platform port rather than directly, since a browser already
 * has its own way of being told the same thing while the tab is closed and answers both calls with
 * nothing rather than showing it twice.
 *
 * The first inbox a session sees is not news — it is whatever arrived before this ran, and showing
 * all of it as if it had just happened would be answering a question nobody asked. So the first pass
 * only remembers what was already there, and it is the *next* notification, the one that was not in
 * that first list, that gets shown. The first pass waits for the inbox to have arrived: before it
 * has, the list is empty rather than unknown, and remembering that empty list made everything
 * unread look new the moment the real one came, every time the window opened or reloaded.
 *
 * A notice goes up only where somebody has turned this device's notices on, in their profile
 * settings. The badge is kept either way, since it asks nothing of anybody.
 *
 * @param presence - Whether the inbox has arrived yet, what is on the bell, how much of it is
 *   unread, and what pressing one does.
 */
const useDeviceNotifications = ({
  isKnown,
  notifications,
  unread,
  onOpen,
}: DeviceNotifications): void => {
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    platformInUse().setUnreadBadge(unread);
  }, [unread]);

  useEffect(() => {
    if (!isKnown) {
      return;
    }

    const arrived = new Set(notifications.map((one) => one.id));
    const already = seen.current;

    seen.current = arrived;

    if (already === null) {
      return;
    }

    for (const notification of notifications) {
      if (notification.readAt === null && !already.has(notification.id)) {
        noticeOnThisDevice({
          title: sayAgain(notification.title),
          body: sayAgain(notification.body),
          onOpen: () => {
            onOpen(notification);
          },
        });
      }
    }
  }, [isKnown, notifications, onOpen]);
};

export { useDeviceNotifications };
