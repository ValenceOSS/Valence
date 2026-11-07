import { describe, expect, it } from 'vitest';
import { createDatabaseMediaRequestStore } from './createDatabaseMediaRequestStore';
import { createDatabaseRequestItemStore } from './createDatabaseRequestItemStore';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import { aScratchDatabase } from '#dialect/aScratchDatabase';

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

  it('reads only one request’s items when asked for them', async () => {
    const db = await aScratchDatabase();
    const store = createDatabaseRequestItemStore(db);
    const requests = createDatabaseMediaRequestStore(db);
    const other = '4e8f2a6c-7b1d-4c3e-9f5a-2d6b8c0e1f3a';

    await requests.insert(aMediaRequest());
    await requests.insert(aMediaRequest({ id: other, tmdbId: 424242 }));
    await store.insert(aRequestItem());
    await store.insert(
      aRequestItem({ id: '6d2c8b4a-0e1f-4a3b-8c5d-9e7f1a2b3c4d', requestId: other }),
    );

    expect((await store.listOf?.(other))?.map((item) => item.requestId)).toEqual([other]);
  });
});
