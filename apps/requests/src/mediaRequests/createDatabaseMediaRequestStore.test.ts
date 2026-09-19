import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aScratchDatabase } from '@ValenceRequests/testing/aScratchDatabase';
import { createDatabaseMediaRequestStore } from './createDatabaseMediaRequestStore';

describe('createDatabaseMediaRequestStore', () => {
  it('keeps, finds, changes and removes requests', async () => {
    const store = createDatabaseMediaRequestStore(await aScratchDatabase());
    const dune = aMediaRequest({ aliases: ['Dune: Part One'], seasons: null });

    expect(await store.insert(dune)).toEqual(dune);
    expect(await store.find(dune.id)).toEqual(dune);
    expect(
      await store.update(dune.id, {
        approval: 'refused',
        catalogueCheckedAt: '2026-09-20T00:00:00.000Z',
        createdAt: '2026-09-18T00:00:00.000Z',
        updatedAt: '2026-09-20T00:00:00.000Z',
      }),
    ).toMatchObject({ approval: 'refused', catalogueCheckedAt: '2026-09-20T00:00:00.000Z' });
    expect(await store.update(dune.id, { title: 'Dune' })).toMatchObject({ title: 'Dune' });
    expect(await store.list()).toHaveLength(1);
    expect(await store.remove(dune.id)).toBe(true);
    expect(await store.remove(dune.id)).toBe(false);
    expect(await store.find(dune.id)).toBeNull();
    expect(await store.update(dune.id, { title: 'x' })).toBeNull();
  });
});
