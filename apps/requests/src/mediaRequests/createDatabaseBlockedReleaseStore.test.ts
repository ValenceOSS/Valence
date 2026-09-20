import { describe, expect, it } from 'vitest';
import { createDatabaseBlockedReleaseStore } from './createDatabaseBlockedReleaseStore';
import { createDatabaseMediaRequestStore } from './createDatabaseMediaRequestStore';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aScratchDatabase } from '@ValenceRequests/testing/aScratchDatabase';

const BLOCKED = {
  id: '5a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
  requestId: aMediaRequest().id,
  title: 'Dune.2021.1080p.BluRay.x264-GRP',
  indexerId: null,
  reason: 'The tracker is gone',
  at: '2026-09-19T00:00:00.000Z',
};

describe('createDatabaseBlockedReleaseStore', () => {
  it('keeps a release blocked for a request once, however often it is blocked', async () => {
    const db = await aScratchDatabase();
    const store = createDatabaseBlockedReleaseStore(db);

    await createDatabaseMediaRequestStore(db).insert(aMediaRequest());

    expect(await store.insert(BLOCKED)).toEqual(BLOCKED);
    expect(
      await store.insert({ ...BLOCKED, id: '6a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d' }),
    ).toMatchObject({
      title: BLOCKED.title,
    });
    expect(await store.list()).toEqual([BLOCKED]);
    expect(await store.find(BLOCKED.id)).toEqual(BLOCKED);
    expect(
      await store.update(BLOCKED.id, { reason: 'Stalled', at: '2026-09-20T00:00:00.000Z' }),
    ).toMatchObject({ reason: 'Stalled', at: '2026-09-20T00:00:00.000Z' });
    expect(await store.update(BLOCKED.id, { reason: 'Gone' })).toMatchObject({ reason: 'Gone' });
    expect(await store.remove(BLOCKED.id)).toBe(true);
    expect(await store.remove(BLOCKED.id)).toBe(false);
    expect(await store.find(BLOCKED.id)).toBeNull();
    expect(await store.update(BLOCKED.id, { reason: 'x' })).toBeNull();
  });
});
