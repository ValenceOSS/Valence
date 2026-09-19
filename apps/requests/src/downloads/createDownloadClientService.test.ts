import { DEFAULT_DOWNLOAD_CATEGORIES } from '@ValenceContracts/schemas/DownloadClient';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { createDownloadClientService } from './createDownloadClientService';
import { DownloadClientFailure } from './DownloadClientFailure';
import type { DownloadClientAdapter } from './DownloadClientAdapter';
import type { DownloadClientRecord } from './DownloadClientRecord';

const AT = new Date('2026-09-19T00:00:00.000Z');

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
  createdAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

/**
 * An adapter that answers its version as told.
 */
const anAdapter = (version: () => Promise<string> = () => Promise.resolve('v5.0.1')) =>
  ({
    version: vi.fn(version),
    add: vi.fn(),
    list: vi.fn(),
    speeds: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    remove: vi.fn(),
  }) satisfies DownloadClientAdapter;

/**
 * A service over the clients given, making adapters with the factory given.
 */
const aService = (
  records: DownloadClientRecord[] = [],
  adapterFor = vi.fn((record: DownloadClientRecord) => {
    void record;

    return anAdapter();
  }),
) => {
  const store = createMemoryRecordStore(records);

  return {
    store,
    adapterFor,
    service: createDownloadClientService({ store, adapterFor, now: () => AT }),
  };
};

describe('createDownloadClientService', () => {
  it('lists clients by priority then name, never showing a password or key', async () => {
    const { service } = aService([
      { ...QBITTORRENT, id: 'b', name: 'Transmission', kind: 'transmission', password: '' },
      QBITTORRENT,
      { ...QBITTORRENT, id: 'c', name: 'SABnzbd', kind: 'sabnzbd', priority: 1, apiKey: 'k' },
    ]);

    const listed = await service.list();

    expect(listed.map((client) => client.name)).toEqual(['SABnzbd', 'qBittorrent', 'Transmission']);
    expect(listed[1]).toEqual({
      id: QBITTORRENT.id,
      name: 'qBittorrent',
      kind: 'qbittorrent',
      url: 'http://qbittorrent:8080',
      username: 'admin',
      hasPassword: true,
      hasApiKey: false,
      categories: DEFAULT_DOWNLOAD_CATEGORIES,
      remotePath: '',
      localPath: '',
      priority: 25,
      isEnabled: true,
      createdAt: QBITTORRENT.createdAt,
      updatedAt: QBITTORRENT.updatedAt,
    });
    expect(JSON.stringify(listed)).not.toContain('secret');
    expect(listed[0]?.hasApiKey).toBe(true);
  });

  it('adds a client with what it was not told filled in', async () => {
    const { service, store } = aService();

    const added = await service.add({ name: 'NZBGet', kind: 'nzbget', url: 'http://nzbget:6789' });

    expect(added).toMatchObject({
      name: 'NZBGet',
      categories: DEFAULT_DOWNLOAD_CATEGORIES,
      remotePath: '',
      localPath: '',
      createdAt: AT.toISOString(),
    });
    expect((await store.find(added.id))?.password).toBe('');
  });

  it('changes a client, keeping a password left blank', async () => {
    const { service, store } = aService([QBITTORRENT]);

    expect(
      await service.change(QBITTORRENT.id, { name: 'Seedbox', password: '', username: undefined }),
    ).toMatchObject({
      name: 'Seedbox',
      hasPassword: true,
      updatedAt: AT.toISOString(),
    });
    expect((await store.find(QBITTORRENT.id))?.password).toBe('secret');

    await service.change(QBITTORRENT.id, { password: 'new' });

    expect((await store.find(QBITTORRENT.id))?.password).toBe('new');
    expect(await service.change('nothing', { name: 'x' })).toBeNull();
  });

  it('speaks to a client through one adapter until it is changed', async () => {
    const { service, adapterFor, store } = aService([QBITTORRENT]);
    const record = await store.find(QBITTORRENT.id);

    if (record === null) {
      throw new Error('The client was not kept');
    }

    expect(service.adapterOf(record)).toBe(service.adapterOf(record));
    expect(adapterFor).toHaveBeenCalledTimes(1);

    await service.change(QBITTORRENT.id, { name: 'Renamed' });

    const changed = await store.find(QBITTORRENT.id);

    if (changed === null) {
      throw new Error('The client was not kept');
    }

    service.adapterOf(changed);

    expect(adapterFor).toHaveBeenCalledTimes(2);
    expect(await service.records()).toEqual([changed]);
  });

  it('tests a kept client, saying its version or why it did not answer', async () => {
    const { service } = aService([QBITTORRENT]);

    expect(await service.test(QBITTORRENT.id)).toEqual({
      isWorking: true,
      problem: null,
      version: 'v5.0.1',
    });
    expect(await service.test('nothing')).toBeNull();

    const refusing = aService(
      [QBITTORRENT],
      vi.fn(() =>
        anAdapter(() =>
          Promise.reject(new DownloadClientFailure('qBittorrent refused the password')),
        ),
      ),
    );

    expect(await refusing.service.test(QBITTORRENT.id)).toEqual({
      isWorking: false,
      problem: 'qBittorrent refused the password',
      version: null,
    });

    const breaking = aService(
      [QBITTORRENT],
      vi.fn(() => anAdapter(() => Promise.reject(new Error('x')))),
    );

    expect((await breaking.service.test(QBITTORRENT.id))?.problem).toBe(
      'The client could not be asked',
    );
  });

  it('tries a change with the password it already has where none is typed', async () => {
    const { service, adapterFor } = aService([QBITTORRENT]);

    await service.tryDraft(
      { name: 'q', kind: 'qbittorrent', url: 'http://elsewhere:8080' },
      QBITTORRENT.id,
    );
    await service.tryDraft({
      name: 'q',
      kind: 'qbittorrent',
      url: 'http://new:8080',
      password: 'typed',
      apiKey: 'key',
    });

    expect(adapterFor.mock.calls[0]?.[0]).toMatchObject({
      id: QBITTORRENT.id,
      url: 'http://elsewhere:8080',
      password: 'secret',
    });
    expect(adapterFor.mock.calls[1]?.[0]).toMatchObject({ password: 'typed', apiKey: 'key' });
  });

  it('removes a client, and says whether there was one', async () => {
    const { service } = aService([QBITTORRENT]);

    expect(await service.remove(QBITTORRENT.id)).toBe(true);
    expect(await service.remove(QBITTORRENT.id)).toBe(false);
  });
});
