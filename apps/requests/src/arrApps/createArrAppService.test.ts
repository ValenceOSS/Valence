import { describe, expect, it, vi } from 'vitest';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { ArrAppFailure } from './ArrAppFailure';
import type { ArrAppRecord } from './ArrAppRecord';
import { createArrAppService } from './createArrAppService';
import type { ProwlarrSync } from './createProwlarrSync';

const NOW = new Date('2026-10-01T00:00:00.000Z');

const SONARR = anArrApp({
  id: '6b2e3d4c-5f6a-4b7c-9d8e-0f1a2b3c4d5e',
  kind: 'sonarr',
  name: 'Sonarr',
  url: 'http://sonarr:8989',
});

const PROWLARR = anArrApp({
  id: '5a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
  kind: 'prowlarr',
  name: 'Prowlarr',
  url: 'http://prowlarr:9696',
});

/**
 * A service over memory, with apps that answer from a table and a Prowlarr sync that reports.
 *
 * @param apps - The apps kept.
 * @param routes - How the apps answer.
 * @param sync - How Prowlarr's indexers are brought in.
 * @returns The service and what it keeps.
 */
const aService = (
  apps: ArrAppRecord[],
  routes: Parameters<typeof aFakeArr>[0] = {},
  sync: Partial<ProwlarrSync> = {},
) => {
  const store = createMemoryRecordStore(apps);
  const arr = aFakeArr(routes);
  const prowlarr = {
    sync: vi.fn<ProwlarrSync['sync']>(
      sync.sync ?? (() => Promise.resolve({ added: 1, updated: 0, removed: 0, unchanged: 0 })),
    ),
    forget: vi.fn<ProwlarrSync['forget']>(() => Promise.resolve(2)),
  };

  return {
    store,
    arr,
    prowlarr,
    service: createArrAppService({
      store,
      connect: (app) => createArrCaller(arr.fetch, app),
      prowlarr,
      now: () => NOW,
    }),
  };
};

describe('createArrAppService', () => {
  it('keeps an app, shows whether it has a key and never what it is', async () => {
    const { service } = aService([]);

    const added = await service.add({
      name: 'Radarr',
      kind: 'radarr',
      url: 'http://radarr:7878',
      apiKey: 'k',
    });

    expect(added).toMatchObject({ name: 'Radarr', hasApiKey: true, isWorking: null });
    expect(added).not.toHaveProperty('apiKey');
    expect((await service.records())[0]?.apiKey).toBe('k');
    expect(await service.list()).toEqual([added]);
  });

  it('changes an app, keeping its key where none is given', async () => {
    const { service, store } = aService([anArrApp()]);

    expect(await service.change(anArrApp().id, { name: 'Films', apiKey: '' })).toMatchObject({
      name: 'Films',
      updatedAt: NOW.toISOString(),
    });
    expect((await store.find(anArrApp().id))?.apiKey).toBe('radarr-key');
    expect(await service.change('nothing', { name: 'x' })).toBeNull();
  });

  it('lets a Prowlarr’s indexers go with it', async () => {
    const { service, prowlarr } = aService([anArrApp(), PROWLARR]);

    expect(await service.remove(anArrApp().id)).toBe(true);
    expect(prowlarr.forget).not.toHaveBeenCalled();
    expect(await service.remove(PROWLARR.id)).toBe(true);
    expect(prowlarr.forget).toHaveBeenCalledWith(PROWLARR);
  });

  it('tests an app and remembers how it went', async () => {
    const { service, store } = aService([anArrApp()], {
      'GET /api/v3/system/status': { body: { appName: 'Radarr', version: '5.14.0.9383' } },
    });

    expect(await service.test(anArrApp().id)).toEqual({
      isWorking: true,
      problem: null,
      problemCode: null,
      version: '5.14.0.9383',
    });
    expect(await store.find(anArrApp().id)).toMatchObject({
      isWorking: true,
      version: '5.14.0.9383',
      lastCheckedAt: NOW.toISOString(),
    });
    expect(await service.test('nothing')).toBeNull();
  });

  it('says where an address answers as another kind of app', async () => {
    const { service } = aService([anArrApp()], {
      'GET /api/v3/system/status': { body: { appName: 'Sonarr', version: '4.0.10.2544' } },
    });

    expect(await service.test(anArrApp().id)).toMatchObject({
      isWorking: false,
      problem: { message: 'That address answers as Sonarr, not radarr.' },
    });
  });

  it('says why an app did not answer, remembering it and its last version', async () => {
    const { service, store } = aService([anArrApp({ version: '5.0' })], {
      'GET /api/v3/system/status': { status: 401, body: null },
    });

    expect(await service.test(anArrApp().id)).toMatchObject({
      isWorking: false,
      problemCode: 'ArrAppKeyRefused',
    });
    expect(await store.find(anArrApp().id)).toMatchObject({
      version: '5.0',
      lastProblemCode: 'ArrAppKeyRefused',
    });
  });

  it('tries an app before it is kept, or a change with the key it has', async () => {
    const { service, arr } = aService([anArrApp()], {
      'GET /api/v3/system/status': { body: { version: '5.14.0.9383' } },
    });

    expect(
      await service.tryDraft({ name: 'R', kind: 'radarr', url: 'http://radarr:7878' }),
    ).toMatchObject({
      isWorking: true,
    });
    await service.tryDraft({ name: 'R', kind: 'radarr', url: 'http://radarr:7878' }, anArrApp().id);
    await service.tryDraft(
      { name: 'R', kind: 'radarr', url: 'http://radarr:7878', apiKey: 'new' },
      'nothing',
    );

    expect(arr.asked).toHaveLength(3);
  });

  it('reads the choices of an app that fulfils requests, and refuses them for Prowlarr', async () => {
    const { service } = aService([SONARR, PROWLARR], {
      'GET /api/v3/rootfolder': { body: [{ path: '/tv', id: 1 }] },
      'GET /api/v3/qualityprofile': { body: [{ name: 'HD-1080p', id: 4 }] },
    });

    expect(await service.choices(SONARR.id)).toMatchObject({ rootFolders: [{ path: '/tv' }] });
    expect(await service.choices(PROWLARR.id)).toMatchObject({
      refused: { message: 'Prowlarr keeps indexers and takes no requests.' },
    });
    expect(await service.choices('nothing')).toBeNull();
  });

  it('says why an app’s choices could not be read', async () => {
    const { service } = aService([SONARR]);

    expect(await service.choices(SONARR.id)).toMatchObject({
      refused: { message: 'Sonarr answered with HTTP 404: NotFound' },
    });
  });

  it('brings in a Prowlarr’s indexers, and only a Prowlarr’s', async () => {
    const { service } = aService([SONARR, PROWLARR]);

    expect(await service.importIndexers(PROWLARR.id)).toMatchObject({ added: 1 });
    expect(await service.importIndexers(SONARR.id)).toMatchObject({
      refused: { message: 'Only Prowlarr has indexers to import.' },
    });
  });

  it('syncs every switched-on Prowlarr, saying where one could not be asked', async () => {
    const { service } = aService(
      [
        PROWLARR,
        { ...PROWLARR, id: crypto.randomUUID(), name: 'Off', isEnabled: false },
        { ...PROWLARR, id: crypto.randomUUID(), name: 'Second' },
        SONARR,
      ],
      {},
      {
        sync: (app) =>
          app.name === 'Second'
            ? Promise.reject(new ArrAppFailure(sayVerbatim('Second could not be reached')))
            : Promise.resolve({ added: 0, updated: 0, removed: 0, unchanged: 3 }),
      },
    );

    expect((await service.syncProwlarr()).map(({ app, outcome }) => [app.name, outcome])).toEqual([
      ['Prowlarr', { added: 0, updated: 0, removed: 0, unchanged: 3 }],
      ['Second', { code: null, message: 'Second could not be reached', values: {} }],
    ]);
  });

  it('lets anything but an app’s failure through', async () => {
    const { service } = aService(
      [PROWLARR],
      {},
      { sync: () => Promise.reject(new Error('Broken')) },
    );

    await expect(service.importIndexers(PROWLARR.id)).rejects.toThrow('Broken');
    expect((await service.syncProwlarr())[0]?.outcome).toMatchObject({
      message: 'The app could not be asked.',
    });
  });

  it('reads every queue there is, saying which app could not be asked', async () => {
    const { service } = aService(
      [anArrApp(), SONARR, PROWLARR, anArrApp({ id: crypto.randomUUID(), isEnabled: false })],
      {
        'GET /api/v3/queue': (asked) =>
          asked.query.get('pageSize') === '1000'
            ? { body: { records: [{ id: 5, movieId: 12, title: 'Dune', status: 'queued' }] } }
            : { body: null },
      },
    );
    const sonarrDown = aService([SONARR], { 'GET /api/v3/queue': { status: 401, body: null } });

    expect(await service.queue()).toMatchObject({
      apps: [
        { name: 'Radarr', kind: 'radarr', problem: null },
        { name: 'Sonarr', kind: 'sonarr', problem: null },
      ],
      items: [
        { id: 5, title: 'Dune' },
        { id: 5, title: 'Dune' },
      ],
    });
    expect(await sonarrDown.service.queue()).toMatchObject({
      apps: [{ name: 'Sonarr', problemCode: 'ArrAppKeyRefused' }],
      items: [],
    });
  });
});
