import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from './aMigratedDatabase';
import { openLockSession } from './openLockSession';

const MIGRATING_MS = 60_000;

describe('openLockSession', () => {
  it(
    'lets one session hold a library and no other, until it gives it up',
    async () => {
      const db = await aMigratedDatabase();
      const first = await openLockSession(db.$client);
      const second = await openLockSession(db.$client);

      await expect(first.take('reading:one')).resolves.toBe(true);
      await expect(second.take('reading:one')).resolves.toBe(false);
      await expect(second.take('reading:two')).resolves.toBe(true);

      await first.release('reading:one');

      await expect(second.take('reading:one')).resolves.toBe(true);
    },
    MIGRATING_MS,
  );

  it(
    'takes a key longer than MySQL would name a lock',
    async () => {
      const db = await aMigratedDatabase();
      const session = await openLockSession(db.$client);

      await expect(session.take(`reading:${'x'.repeat(200)}`)).resolves.toBe(true);
    },
    MIGRATING_MS,
  );
});
