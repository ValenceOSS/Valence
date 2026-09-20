import { DEFAULT_DOWNLOAD_CATEGORIES } from '@ValenceContracts/schemas/DownloadClient';
import { describe, expect, it } from 'vitest';
import { aScratchDatabase } from '@ValenceRequests/testing/aScratchDatabase';
import { createDatabaseDownloadClientStore } from './createDatabaseDownloadClientStore';
import { createDatabaseSentDownloadStore } from './createDatabaseSentDownloadStore';
import type { SentDownloadRecord } from './SentDownloadRecord';

const CLIENT_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';

const DUNE: SentDownloadRecord = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  clientId: CLIENT_ID,
  remoteId: 'c12fe1c06bba254a9dc9f519b335aa7c1367a88a',
  protocol: 'torrent',
  libraryKind: 'movies',
  title: 'Dune',
  indexerName: 'Jackett',
  state: 'queued',
  problem: null,
  progress: 0,
  sizeBytes: 8_000_000_000,
  doneBytes: null,
  sentAt: '2026-09-19T00:00:00.000Z',
  finishedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
};

/**
 * A scratch database with a client for downloads to belong to.
 */
const withAClient = async () => {
  const db = await aScratchDatabase();

  await createDatabaseDownloadClientStore(db).insert({
    id: CLIENT_ID,
    name: 'qBittorrent',
    kind: 'qbittorrent',
    url: 'http://qbittorrent:8080',
    username: '',
    password: '',
    apiKey: '',
    categories: DEFAULT_DOWNLOAD_CATEGORIES,
    priority: 25,
    isEnabled: true,
    createdAt: '2026-09-19T00:00:00.000Z',
    updatedAt: '2026-09-19T00:00:00.000Z',
  });

  return db;
};

describe('createDatabaseSentDownloadStore', () => {
  it('keeps a download, and reads it back as it was given', async () => {
    const store = createDatabaseSentDownloadStore(await withAClient());

    expect(await store.insert(DUNE)).toEqual(DUNE);
    expect(await store.list()).toEqual([DUNE]);
    expect(await store.find(DUNE.id)).toEqual(DUNE);
    expect(await store.find(CLIENT_ID)).toBeNull();
  });

  it('keeps when it finished, and when it was sent', async () => {
    const store = createDatabaseSentDownloadStore(await withAClient());

    await store.insert({ ...DUNE, finishedAt: '2026-09-19T01:00:00.000Z' });

    expect(
      await store.update(DUNE.id, {
        state: 'done',
        progress: 1,
        sentAt: '2026-09-18T00:00:00.000Z',
        finishedAt: null,
        updatedAt: '2026-09-19T02:00:00.000Z',
      }),
    ).toEqual({
      ...DUNE,
      state: 'done',
      progress: 1,
      sentAt: '2026-09-18T00:00:00.000Z',
      finishedAt: null,
      updatedAt: '2026-09-19T02:00:00.000Z',
    });
    expect(await store.update(DUNE.id, { finishedAt: '2026-09-19T03:00:00.000Z' })).toMatchObject({
      finishedAt: '2026-09-19T03:00:00.000Z',
    });
    expect(await store.update(CLIENT_ID, { state: 'done' })).toBeNull();
  });

  it('forgets a download, and says whether there was one', async () => {
    const store = createDatabaseSentDownloadStore(await withAClient());

    await store.insert(DUNE);

    expect(await store.remove(DUNE.id)).toBe(true);
    expect(await store.remove(DUNE.id)).toBe(false);
  });

  it('forgets a client’s downloads along with the client', async () => {
    const db = await withAClient();
    const store = createDatabaseSentDownloadStore(db);

    await store.insert(DUNE);
    await createDatabaseDownloadClientStore(db).remove(CLIENT_ID);

    expect(await store.list()).toEqual([]);
  });
});
