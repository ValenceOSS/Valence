import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { createDatabaseEmailSendStore } from './createDatabaseEmailSendStore';

const STARTING_DATABASE_MS = 60_000;

const REFUSED = sayVerbatim('550 mailbox unavailable');

describe('createDatabaseEmailSendStore', () => {
  it(
    'knows a key was sent only once it went, and keeps one row per key',
    async () => {
      const store = createDatabaseEmailSendStore(await aMigratedDatabase());
      const send = {
        kind: 'setupLink',
        recipient: 'ada@example.com',
        idempotencyKey: 'k1',
      } as const;

      expect(await store.wasSent('k1')).toBe(false);

      await store.record({ ...send, failure: REFUSED });

      expect(await store.wasSent('k1')).toBe(false);
      expect(await store.recent(10)).toMatchObject([{ state: 'failed', failure: REFUSED }]);

      await store.record({ ...send, failure: null });

      expect(await store.wasSent('k1')).toBe(true);
      expect(await store.recent(10)).toMatchObject([
        { kind: 'setupLink', recipient: 'ada@example.com', state: 'sent', failure: null },
      ]);
    },
    STARTING_DATABASE_MS,
  );

  it(
    'lists the newest first, as many as asked for',
    async () => {
      const store = createDatabaseEmailSendStore(await aMigratedDatabase());

      await store.record({
        kind: 'test',
        recipient: 'a@example.com',
        idempotencyKey: 'a',
        failure: null,
      });
      await new Promise((settle) => setTimeout(settle, 5));
      await store.record({
        kind: 'test',
        recipient: 'b@example.com',
        idempotencyKey: 'b',
        failure: null,
      });

      expect((await store.recent(1)).map((one) => one.recipient)).toEqual(['b@example.com']);
    },
    STARTING_DATABASE_MS,
  );
});
