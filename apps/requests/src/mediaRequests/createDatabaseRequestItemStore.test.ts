import { describe, expect, it } from 'vitest';
import { createDatabaseMediaRequestStore } from './createDatabaseMediaRequestStore';
import { createDatabaseRequestItemStore } from './createDatabaseRequestItemStore';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import { aScratchDatabase } from '@ValenceRequests/testing/aScratchDatabase';

describe('createDatabaseRequestItemStore', () => {
  it('keeps, finds, changes and removes what a request waits for', async () => {
    const db = await aScratchDatabase();
    const store = createDatabaseRequestItemStore(db);
    const film = aRequestItem({ lastSearchedAt: '2026-09-19T01:00:00.000Z' });

    await createDatabaseMediaRequestStore(db).insert(aMediaRequest());

    expect(await store.insert(film)).toEqual(film);
    expect(await store.find(film.id)).toEqual(film);
    expect(
      await store.update(film.id, { lastSearchedAt: null, updatedAt: '2026-09-20T00:00:00.000Z' }),
    ).toMatchObject({ lastSearchedAt: null, updatedAt: '2026-09-20T00:00:00.000Z' });
    expect(
      await store.update(film.id, { lastSearchedAt: '2026-09-20T01:00:00.000Z', state: 'filed' }),
    ).toMatchObject({ lastSearchedAt: '2026-09-20T01:00:00.000Z', state: 'filed' });
    expect(await store.list()).toHaveLength(1);
    expect(await store.remove(film.id)).toBe(true);
    expect(await store.remove(film.id)).toBe(false);
    expect(await store.find(film.id)).toBeNull();
    expect(await store.update(film.id, { state: 'wanted' })).toBeNull();
  });
});
