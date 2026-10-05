import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clearNotifications,
  markNotificationsRead,
} from '@ValenceClient/notifications/fetchNotifications';
import {
  canReceivePush,
  subscribeToPush,
  unsubscribeFromPush,
} from '@ValenceScreens/notifications/subscribeToPush';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import type { Inbox } from '@ValenceClient/notifications/fetchNotifications';
import type { NotificationBellProps } from '@ValenceScreens/components/NotificationBell/NotificationBell.types';

const NOTHING_WAITING: Inbox = { notifications: [], unread: 0 };

/**
 * Everything the bell needs: what is waiting, whether this device has it pushed, and what reading,
 * clearing and following one does to the shared inbox. Wherever the bell is drawn — the dock, or the
 * desktop's window bar — it is the same inbox.
 *
 * @param isOn - Whether there is anybody signed in to ask about, so nothing is asked before there is.
 * @returns What to hand the bell.
 */
const useTheInbox = (isOn = true): NotificationBellProps => {
  const cache = useQueryClient();
  const [pushChoice, setPushChoice] = useState<boolean | null>(null);
  const held = useQuery({ ...notificationQueries.inbox(), enabled: isOn });
  const inbox = held.data ?? NOTHING_WAITING;
  const howToPush = useQuery({ ...notificationQueries.settings(), enabled: isOn });
  const pushKey = howToPush.data?.pushPublicKey ?? '';
  const isPushOn = pushChoice ?? howToPush.data?.preferences.some((one) => one.push) ?? false;

  return {
    notifications: inbox.notifications,
    unread: inbox.unread,
    ...(pushKey === '' || !canReceivePush()
      ? {}
      : {
          push: {
            isOn: isPushOn,
            onToggle: () => {
              void (
                isPushOn ? unsubscribeFromPush().then(() => false) : subscribeToPush(pushKey)
              ).then(setPushChoice);
            },
          },
        }),
    onOpen: () => {
      void cache.invalidateQueries({ queryKey: notificationQueries.key });
    },
    onRead: (id) => {
      void markNotificationsRead(id).then((unread) => {
        cache.setQueryData(notificationQueries.inbox().queryKey, (waiting: Inbox | undefined) =>
          waiting === undefined
            ? waiting
            : {
                unread,
                notifications: waiting.notifications.map((one) =>
                  one.id === id && one.readAt === null
                    ? { ...one, readAt: new Date().toISOString() }
                    : one,
                ),
              },
        );
      });
    },
    onReadAll: () => {
      void markNotificationsRead().then(() =>
        cache.invalidateQueries({ queryKey: notificationQueries.key }),
      );
    },
    onClearAll: () => {
      void clearNotifications().then(() =>
        cache.invalidateQueries({ queryKey: notificationQueries.key }),
      );
    },
    onFollow: (link) => {
      window.location.assign(link);
    },
  };
};

export { useTheInbox };
