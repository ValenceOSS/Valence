import type { NotificationStore } from './NotificationStore';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { pushSubscription, user } from '#dialect/Schema';
import { createDatabaseNotificationStore } from './createDatabaseNotificationStore';

const STARTING_POSTGRES_MS = 60_000;

const A_NOTE = {
  event: 'media.added',
  title: sayVerbatim('New'),
  body: sayVerbatim('Something arrived'),
  link: null,
} satisfies Parameters<NotificationStore['notify']>[1];

/**
 * A database holding two accounts and nothing else.
 *
 * @returns The database.
 */
const aDatabaseWithTwoAccounts = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values([
    { id: 'ann', name: 'Ann', email: 'ann@example.com' },
    { id: 'bob', name: 'Bob', email: 'bob@example.com' },
  ]);

  return db;
};

describe('createDatabaseNotificationStore', () => {
  it(
    'counts only what the account has not read',
    async () => {
      const store = createDatabaseNotificationStore(await aDatabaseWithTwoAccounts());
      const [first] = await store.notify(['ann'], A_NOTE);

      await store.notify(['ann', 'bob'], A_NOTE);

      expect(await store.countUnread('ann')).toBe(2);

      await store.markRead('ann', first?.id);

      expect(await store.countUnread('ann')).toBe(1);
      expect(await store.countUnread('bob')).toBe(1);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps one preference per account and event, changing it when written again',
    async () => {
      const store = createDatabaseNotificationStore(await aDatabaseWithTwoAccounts());

      await store.writePreference('ann', { event: A_NOTE.event, inApp: true, push: true });
      await store.writePreference('ann', { event: A_NOTE.event, inApp: false, push: true });

      expect(await store.readPreferences('ann')).toStrictEqual([
        { event: A_NOTE.event, inApp: false, push: true },
      ]);
      expect(await store.listWanting(A_NOTE.event, 'push')).toContain('ann');
      expect(await store.listWanting(A_NOTE.event, 'inApp')).not.toContain('ann');
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'moves a push endpoint to whoever registered it last, keeping one row for it',
    async () => {
      const db = await aDatabaseWithTwoAccounts();
      const store = createDatabaseNotificationStore(db);
      const endpoint = 'https://push.example.com/1';

      await store.addPushEndpoint('ann', { endpoint, p256dh: 'a', auth: 'a' });
      await store.addPushEndpoint('bob', { endpoint, p256dh: 'b', auth: 'b' });

      expect(await store.listPushEndpoints('ann')).toStrictEqual([]);
      expect(await store.listPushEndpoints('bob')).toStrictEqual([
        { endpoint, p256dh: 'b', auth: 'b' },
      ]);
      expect(await db.select().from(pushSubscription)).toHaveLength(1);
    },
    STARTING_POSTGRES_MS,
  );
});
