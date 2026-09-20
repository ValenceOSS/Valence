import { DEFAULT_DOWNLOAD_CATEGORIES } from '@ValenceContracts/schemas/DownloadClient';
import { describe, expect, it } from 'vitest';
import { aScratchDatabase } from '@ValenceRequests/testing/aScratchDatabase';
import { createDatabaseDownloadClientStore } from './createDatabaseDownloadClientStore';
import type { DownloadClientRecord } from './DownloadClientRecord';

const QBITTORRENT: DownloadClientRecord = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'qBittorrent',
  kind: 'qbittorrent',
  url: 'http://qbittorrent:8080',
  username: 'admin',
  password: 'secret',
  apiKey: '',
  categories: DEFAULT_DOWNLOAD_CATEGORIES,
  remotePath: '',
  localPath: '',
  priority: 25,
  isEnabled: true,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

describe('createDatabaseDownloadClientStore', () => {
  it('keeps a client, and reads it back as it was given', async () => {
    const store = createDatabaseDownloadClientStore(await aScratchDatabase());

    expect(await store.insert(QBITTORRENT)).toEqual(QBITTORRENT);
    expect(await store.list()).toEqual([QBITTORRENT]);
    expect(await store.find(QBITTORRENT.id)).toEqual(QBITTORRENT);
    expect(await store.find('7c9e6679-7425-40de-944b-e07fc1f90ae7')).toBeNull();
  });

  it('changes only what it is told to, moments included', async () => {
    const store = createDatabaseDownloadClientStore(await aScratchDatabase());

    await store.insert(QBITTORRENT);

    expect(
      await store.update(QBITTORRENT.id, {
        isEnabled: false,
        createdAt: '2026-09-18T00:00:00.000Z',
        updatedAt: '2026-09-20T00:00:00.000Z',
      }),
    ).toEqual({
      ...QBITTORRENT,
      isEnabled: false,
      createdAt: '2026-09-18T00:00:00.000Z',
      updatedAt: '2026-09-20T00:00:00.000Z',
    });
    expect(await store.update(QBITTORRENT.id, { name: 'Renamed' })).toMatchObject({
      name: 'Renamed',
    });
    expect(
      await store.update('7c9e6679-7425-40de-944b-e07fc1f90ae7', { isEnabled: false }),
    ).toBeNull();
  });

  it('forgets a client, and says whether there was one', async () => {
    const store = createDatabaseDownloadClientStore(await aScratchDatabase());

    await store.insert(QBITTORRENT);

    expect(await store.remove(QBITTORRENT.id)).toBe(true);
    expect(await store.remove(QBITTORRENT.id)).toBe(false);
  });
});
