import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { importSource } from '#dialect/Schema';
import { createDatabaseImportStore } from './createDatabaseImportStore';

const DETAILS = {
  serverId: 'server',
  version: '12.1.0',
  clientId: 'client',
  userTokens: {},
  pathMappings: [{ from: '/data', to: '/media' }],
};

describe('createDatabaseImportStore', { timeout: 60_000 }, () => {
  it('keeps sources with their key and details, and lists only media servers', async () => {
    const db = await aMigratedDatabase();
    const store = createDatabaseImportStore(db);
    const added = await store.addSource({
      kind: 'jellyfin',
      name: 'Den',
      url: 'http://den',
      token: 'key',
      details: DETAILS,
    });

    await db
      .insert(importSource)
      .values({ id: 'arr', kind: 'radarr', name: 'Radarr', url: 'http://r', token: 'k' });
    await store.changeSource(added.id, { details: { ...DETAILS, version: '12.2.0' } });

    expect(await store.findSource(added.id)).toMatchObject({
      kind: 'jellyfin',
      token: 'key',
      details: { version: '12.2.0', pathMappings: [{ from: '/data', to: '/media' }] },
    });
    expect((await store.listSources()).map((source) => source.id)).toEqual([added.id]);
    expect(await store.findSource('arr')).toBeNull();
    expect(await store.findSource('missing')).toBeNull();

    await store.removeSource(added.id);

    expect(await store.listSources()).toEqual([]);
  });

  it('keeps runs, changing them as they go, and finds the latest for each source', async () => {
    const db = await aMigratedDatabase();
    const store = createDatabaseImportStore(db);
    const source = await store.addSource({
      kind: 'plex',
      name: 'Shed',
      url: 'http://shed',
      token: 't',
      details: DETAILS,
    });
    const first = await store.addRun(source.id, { skipUserIds: ['x'], meUserId: 'me', by: null });

    expect(first).toMatchObject({
      state: 'planning',
      options: { skipUserIds: ['x'], meUserId: 'me' },
      cursor: null,
      report: null,
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });

    const second = await store.addRun(source.id, { skipUserIds: [], meUserId: null, by: null });

    await store.changeRun(second.id, {
      state: 'importing',
      cursor: { phase: 'viewing', index: 2 },
      jobId: 'job',
    });

    expect(await store.findRun(second.id)).toMatchObject({
      state: 'importing',
      cursor: { phase: 'viewing', index: 2 },
      jobId: 'job',
    });
    expect((await store.latestRuns()).map((run) => run.id)).toEqual([second.id]);
    expect(await store.findRun('missing')).toBeNull();
  });

  it('remembers which source thing became which Valence thing, changing it when told', async () => {
    const db = await aMigratedDatabase();
    const store = createDatabaseImportStore(db);
    const source = await store.addSource({
      kind: 'emby',
      name: 'Lounge',
      url: 'http://l',
      token: 't',
      details: DETAILS,
    });

    await store.setLink(source.id, 'account', '1001', 'user-a');
    await store.setLink(source.id, 'account', '1001', 'user-b');
    await store.setLink(source.id, 'playlist', '1001:p', 'playlist-a');

    expect(await store.links(source.id, 'account')).toEqual(new Map([['1001', 'user-b']]));
  });
});
