import { describe, expect, it } from 'vitest';
import { aScratchDatabase } from '@ValenceRequests/testing/aScratchDatabase';
import { createDatabaseDownloadEventStore } from './createDatabaseDownloadEventStore';

describe('createDatabaseDownloadEventStore', () => {
  it('keeps events, oldest first, until the server says it has them', async () => {
    const store = createDatabaseDownloadEventStore(await aScratchDatabase());

    const started = await store.add({
      kind: 'started',
      title: 'Dune',
      clientName: 'qBittorrent',
      problem: null,
    });
    const failed = await store.add({
      kind: 'failed',
      title: 'Dune',
      clientName: 'qBittorrent',
      problem: 'The tracker is gone',
    });

    expect((await store.pending()).map((event) => event.kind)).toEqual(['started', 'failed']);
    expect(failed.id).toBeGreaterThan(started.id);
    expect(Date.parse(started.at)).not.toBeNaN();

    await store.acknowledge([started.id]);
    await store.acknowledge([]);

    expect(await store.pending()).toEqual([failed]);
  });
});
