import { describe, expect, it } from 'vitest';
import { aScratchDatabase } from '@ValenceRequests/testing/aScratchDatabase';
import { createDatabaseSettingStore } from './createDatabaseSettingStore';

describe('createDatabaseSettingStore', () => {
  it('keeps a value against a key, and reads it back', async () => {
    const store = createDatabaseSettingStore(await aScratchDatabase());

    await store.write('profilesSeededAt', '2026-09-21T00:00:00.000Z');

    expect(await store.read('profilesSeededAt')).toBe('2026-09-21T00:00:00.000Z');
  });

  it('says nothing for a key nothing was kept against', async () => {
    const store = createDatabaseSettingStore(await aScratchDatabase());

    expect(await store.read('never-written')).toBeNull();
  });

  it('writes over what was there rather than refusing the key', async () => {
    const store = createDatabaseSettingStore(await aScratchDatabase());

    await store.write('a-key', 'first');
    await store.write('a-key', 'second');

    expect(await store.read('a-key')).toBe('second');
  });

  it('says nothing for a key holding something that is not a string', async () => {
    const db = await aScratchDatabase();
    const store = createDatabaseSettingStore(db);
    const { setting } = await import('@ValenceRequests/db/Schema');

    await db.insert(setting).values({ key: 'shaped', value: { some: 'object' } });

    expect(await store.read('shaped')).toBeNull();
  });
});
