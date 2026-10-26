import { useState } from 'react';
import type { Notification } from '@ValenceContracts/schemas/Notification';
import { NotificationList } from '@ValenceScreens/components/NotificationBell/components/NotificationList/NotificationList';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';
import type { NotificationsPictureProps } from './NotificationsPicture.types';

const MINUTE = 60_000;

/**
 * What has reached the made-up household's bell, the party arriving on top once acted out.
 *
 * @param now - Now.
 * @param hasArrived - Whether the party has started.
 * @returns The notifications, newest first.
 */
const notificationsAt = (now: number, hasArrived: boolean): Notification[] => [
  ...(hasArrived
    ? [
        {
          id: '00000000-0000-4000-8000-0000000000e1',
          event: 'party.invited' as const,
          title: sayVerbatim('Ruth started a party'),
          body: sayVerbatim('Paper Moons, starting now for everyone'),
          link: '/party',
          createdAt: new Date(now).toISOString(),
          readAt: null,
        },
      ]
    : []),
  {
    id: '00000000-0000-4000-8000-0000000000e2',
    event: 'media.added',
    title: sayVerbatim('New episode'),
    body: sayVerbatim('The Lantern Keepers S2 E5 is ready'),
    link: '/shows',
    createdAt: new Date(now - 4 * MINUTE).toISOString(),
    readAt: null,
  },
  {
    id: '00000000-0000-4000-8000-0000000000e3',
    event: 'requests.available',
    title: sayVerbatim('Your request arrived'),
    body: sayVerbatim('Harbour Lights (2024) was added'),
    link: '/films',
    createdAt: new Date(now - 120 * MINUTE).toISOString(),
    readAt: new Date(now - 60 * MINUTE).toISOString(),
  },
];

/**
 * The notification list as the bell opens it, drawn by the app's own list; acted out, another
 * arrives on top and the rest move down beneath it.
 *
 * @param isActed - Whether the party has started.
 */
const NotificationsPicture = ({ isActed = false }: NotificationsPictureProps) => {
  const [now] = useState(() => Date.now());

  return (
    <div className="text-left">
      <NotificationList
        notifications={notificationsAt(now, isActed)}
        unread={isActed ? 2 : 1}
        onRead={nothing}
        onReadAll={nothing}
        onClearAll={nothing}
        onFollow={nothing}
      />
    </div>
  );
};

NotificationsPicture.displayName = 'NotificationsPicture';

export { NotificationsPicture };
