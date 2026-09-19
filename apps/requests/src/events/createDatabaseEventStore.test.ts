import { describe, expect, it } from 'vitest';
import { serviceEvent } from '@ValenceRequests/db/Schema';
import { aScratchDatabase } from '@ValenceRequests/testing/aScratchDatabase';
import { createDatabaseEventStore } from './createDatabaseEventStore';

describe('createDatabaseEventStore', () => {
  it('keeps events, oldest first, until the server says it has them', async () => {
    const store = createDatabaseEventStore(await aScratchDatabase());

    const started = await store.add({ kind: 'started', title: 'Dune', clientName: 'qBittorrent' });
    const filed = await store.add({
      kind: 'filed',
      title: 'Dune',
      requestId: '0f8fad5b-d9cb-469f-a165-70867728950e',
      requestedById: 'someone',
      requestKind: 'film',
      tmdbId: 438631,
      libraryId: 'films',
      folder: '/media/Films/Dune (2021)',
    });

    expect((await store.pending()).map((event) => event.kind)).toEqual(['started', 'filed']);
    expect(filed).toMatchObject({ kind: 'filed', tmdbId: 438631 });
    expect(filed.id).toBeGreaterThan(started.id);

    await store.acknowledge([started.id]);
    await store.acknowledge([]);

    expect(await store.pending()).toEqual([filed]);
  });

  it('reads an event kept before events carried their details', async () => {
    const db = await aScratchDatabase();

    await db.insert(serviceEvent).values({
      kind: 'failed',
      title: 'Dune',
      clientName: 'qBittorrent',
      problem: 'The tracker is gone',
    });
    await db.insert(serviceEvent).values({ kind: 'nonsense', title: 'Dune' });

    expect(await createDatabaseEventStore(db).pending()).toMatchObject([
      { kind: 'failed', clientName: 'qBittorrent', problem: 'The tracker is gone' },
    ]);
  });
});
