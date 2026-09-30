import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { createDatabaseJobTriggerStore } from './createDatabaseJobTriggerStore';

const STARTING_POSTGRES_MS = 60_000;

describe('createDatabaseJobTriggerStore', () => {
  it(
    'keeps what it was given and lists it back',
    async () => {
      const store = createDatabaseJobTriggerStore(await aMigratedDatabase());
      const added = await store.add('library.scan', { kind: 'everyHours', hours: 6 });

      expect(await store.list()).toEqual([added]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'says it removed a trigger only where there was one of that kind to remove',
    async () => {
      const store = createDatabaseJobTriggerStore(await aMigratedDatabase());
      const added = await store.add('library.scan', { kind: 'startup' });

      expect(await store.remove('server.pruneLogs', added.id)).toBe(false);
      expect(await store.remove('library.scan', added.id)).toBe(true);
      expect(await store.remove('library.scan', added.id)).toBe(false);
      expect(await store.list()).toEqual([]);
    },
    STARTING_POSTGRES_MS,
  );
});
