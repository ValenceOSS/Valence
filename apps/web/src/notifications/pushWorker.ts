import { z } from 'zod';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { say } from '@ValenceI18n/say';
import { gatherNotices } from '@ValenceClient/notifications/gatherNotices';
import type { Notice } from '@ValenceClient/notifications/gatherNotices';

type PushMessage = {
  data: { json: () => JsonValue } | null;
  waitUntil: (work: Promise<void>) => void;
};

type NotificationClick = {
  notification: { close: () => void; data: { link?: string } };
  waitUntil: (work: Promise<void>) => void;
};

type OpenWindow = {
  focus: () => Promise<OpenWindow | null>;
  navigate: (url: string) => Promise<OpenWindow | null>;
};

type Gathering = { link: string; notices?: Notice[]; firstShownAt?: number };

type DrawnNotification = {
  body: string;
  icon: string;
  badge: string;
  data: Gathering;
  tag: string;
  renotify: boolean;
};

type ShownNotification = { title: string; body: string; data: Gathering | null };

declare const registration: {
  showNotification: (title: string, options: DrawnNotification) => Promise<void>;
  getNotifications: (filter: { tag: string }) => Promise<ShownNotification[]>;
};

declare const clients: {
  matchAll: (options: { type: 'window'; includeUncontrolled: boolean }) => Promise<OpenWindow[]>;
  openWindow: (url: string) => Promise<void>;
};

declare function addEventListener(kind: 'push', listen: (event: PushMessage) => void): void;

declare function addEventListener(
  kind: 'notificationclick',
  listen: (event: NotificationClick) => void,
): void;

const PushContentSchema = z.object({
  title: z.string().default(say('common.valence')),
  body: z.string().default(say('common.somethingNewToWatch')),
  link: z.string().nullish(),
});

/**
 * Reads what a push message says, through a schema and with a fallback at every step. A worker that
 * throws on a malformed push shows nothing at all, so anything unreadable becomes a plain notice
 * rather than an error.
 *
 * @param event - The push as it arrived.
 * @returns What to show.
 */
const readContent = (event: PushMessage) => {
  if (event.data === null) {
    return PushContentSchema.parse({});
  }

  const read = PushContentSchema.safeParse(event.data.json());

  return read.success ? read.data : PushContentSchema.parse({});
};

addEventListener('push', (event) => {
  const { title, body, link } = readContent(event);

  const tag = 'valence-media-added';

  event.waitUntil(
    registration.getNotifications({ tag }).then(async ([showing]) => {
      const earlier =
        showing === undefined
          ? null
          : {
              notices: showing.data?.notices ?? [
                { title: showing.title, body: showing.body, link: showing.data?.link ?? '/' },
              ],
              firstShownAt: showing.data?.firstShownAt ?? 0,
            };
      const shown = gatherNotices(earlier, { title, body, link: link ?? '/' }, Date.now());

      await registration.showNotification(shown.title, {
        body: shown.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { link: shown.link, notices: shown.notices, firstShownAt: shown.firstShownAt },
        tag,
        renotify: shown.renotify,
      });
    }),
  );
});

addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data.link ?? '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windows) => {
      const open = windows[0];

      if (open === undefined) {
        await clients.openWindow(link);

        return;
      }

      await open.focus();
      await open.navigate(link).catch(() => undefined);
    }),
  );
});

export type { NotificationClick, PushMessage };
