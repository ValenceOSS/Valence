import { useEffect, useRef } from 'react';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { Notification } from '@ValenceClient/notifications/fetchNotifications';

type DeviceNotifications = {
  notifications: Notification[];
  unread: number;
  onOpen: (link: string | null) => void;
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
 * that first list, that gets shown.
 *
 * @param presence - What is on the bell, how much of it is unread, and where a press should lead.
 */
const useDeviceNotifications = ({ notifications, unread, onOpen }: DeviceNotifications): void => {
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    platformInUse().setUnreadBadge(unread);
  }, [unread]);

  useEffect(() => {
    const arrived = new Set(notifications.map((one) => one.id));
    const already = seen.current;

    seen.current = arrived;

    if (already === null) {
      return;
    }

    for (const notification of notifications) {
      if (notification.readAt === null && !already.has(notification.id)) {
        platformInUse().notifyLocally({
          title: notification.title,
          body: notification.body,
          onOpen: () => {
            onOpen(notification.link);
          },
        });
      }
    }
  }, [notifications, onOpen]);
};

export { useDeviceNotifications };
