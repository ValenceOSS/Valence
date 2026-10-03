import { describe, expect, it, vi } from 'vitest';
import { createArrAppService } from '@ValenceRequests/arrApps/createArrAppService';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { createProwlarrSync } from '@ValenceRequests/arrApps/createProwlarrSync';
import type { ArrAppRecord } from '@ValenceRequests/arrApps/ArrAppRecord';
import { createDownloadClientService } from '@ValenceRequests/downloads/createDownloadClientService';
import type { DownloadClientRecord } from '@ValenceRequests/downloads/DownloadClientRecord';
import { createIndexerService } from '@ValenceRequests/indexers/createIndexerService';
import type { IndexerRecord } from '@ValenceRequests/indexers/IndexerRecord';
import { createProfileService } from '@ValenceRequests/profiles/createProfileService';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import { aFakeLan } from '@ValenceRequests/arrImport/testing/aFakeLan';
import { LIBRARIES } from '@ValenceRequests/arrImport/testing/LIBRARIES';
import { createArrImportService } from './createArrImportService';

const [FILMS, SERIES, MUSIC] = LIBRARIES;

/**
 * The import over stores held in memory, reading from a network of recorded apps.
 */
const anImport = () => {
  const lan = aFakeLan({
    'http://overseerr:5055': 'overseerr',
    'http://radarr:7878': 'radarr-v5',
    'http://sonarr:8989': 'sonarr-v4',
    'http://lidarr:8686': 'lidarr-v2',
    'http://prowlarr:9696': 'prowlarr',
  });
  const connectApp = (app: ArrAppRecord) => createArrCaller(lan.fetch, app, 1);
  const clientStore = createMemoryRecordStore<DownloadClientRecord>();
  const indexerStore = createMemoryRecordStore<IndexerRecord>();
  const profileStore = createMemoryRecordStore<QualityProfile>();
  const appStore = createMemoryRecordStore<ArrAppRecord>();
  const prowlarr = createProwlarrSync({ indexers: indexerStore, connect: connectApp });
  const unused = () => Promise.reject(new Error('unused'));
  const service = createArrImportService({
    connect: lan.connect,
    clients: createDownloadClientService({
      store: clientStore,
      adapterFor: () => {
        throw new Error('unused');
      },
    }),
    indexers: createIndexerService({
      store: indexerStore,
      client: { capabilities: vi.fn(unused), search: vi.fn(unused), download: vi.fn(unused) },
    }),
    profiles: createProfileService({ store: profileStore }),
    apps: createArrAppService({ store: appStore, connect: connectApp, prowlarr }),
    prowlarr,
  });

  return { service, lan, clientStore, indexerStore, profileStore, appStore };
};

const ORDER = {
  sources: [
    { kind: 'overseerr' as const, url: 'http://overseerr:5055', apiKey: 'overseerr-key' },
    { kind: 'lidarr' as const, url: 'http://lidarr:8686', apiKey: 'lidarr-key' },
    { kind: 'prowlarr' as const, url: 'http://prowlarr:9696', apiKey: 'prowlarr-key' },
  ],
  pathMappings: [
    { from: '/movies', to: '/media/Films' },
    { from: '/tv', to: '/media/Series' },
    { from: '/music', to: '/media/Music' },
  ],
  secrets: { 'client:qbittorrent@http://qbittorrent:8080:password': 'typed-in' },
  choices: { [SERIES?.id ?? '']: 'takeOver' as const, [MUSIC?.id ?? '']: 'leave' as const },
  libraries: [...LIBRARIES],
};

describe('createArrImportService', () => {
  it('plans without writing anything anywhere', async () => {
    const { service, lan, clientStore, profileStore, appStore } = anImport();
    const plan = await service.plan(ORDER);

    expect(plan.clients).toHaveLength(4);
    expect(await clientStore.list()).toEqual([]);
    expect(await profileStore.list()).toEqual([]);
    expect(await appStore.list()).toEqual([]);
    expect(lan.asked.every((one) => one.method === 'GET')).toBe(true);
  });

  it('brings a setup in, hands libraries over or takes them over as asked, and only reads the apps', async () => {
    const { service, lan, clientStore, indexerStore, profileStore, appStore } = anImport();
    const applied = await service.apply(ORDER);
    const profiles = await profileStore.list();
    const radarr = (await appStore.list()).find((one) => one.kind === 'radarr');

    expect(applied).toMatchObject({
      clients: { added: 3, kept: 0 },
      indexers: { added: 1, kept: 0 },
      profiles: { added: 3, kept: 0 },
      apps: { added: 2, kept: 0 },
      prowlarr: { added: 2, updated: 0, removed: 0, unchanged: 0 },
      problems: [],
    });
    expect(applied.libraries).toEqual([
      {
        libraryId: FILMS?.id,
        choice: 'handOff',
        fulfilment: {
          appId: radarr?.id,
          rootFolderPath: '/movies',
          qualityProfileId: 4,
          metadataProfileId: null,
          searchesOnAdd: true,
        },
        profileId: null,
      },
      {
        libraryId: SERIES?.id,
        choice: 'takeOver',
        fulfilment: null,
        profileId: profiles.find((one) => one.name === 'WEB-1080p')?.id,
      },
    ]);
    expect(radarr).toMatchObject({
      url: 'http://radarr:7878',
      apiKey: 'radarr-plain-key',
      remotePath: '/movies',
      localPath: '/media/Films',
    });
    expect((await clientStore.list()).find((one) => one.kind === 'qbittorrent')?.password).toBe(
      'typed-in',
    );
    expect((await indexerStore.list()).map((one) => one.name).toSorted()).toEqual([
      '1337x',
      'NZBgeek',
      'NZBgeek',
    ]);
    expect(applied.wanted.find((one) => one.key === 'film:693134')).toMatchObject({
      libraryId: FILMS?.id,
      profileId: profiles.find((one) => one.name === 'HD-1080p')?.id,
    });
    expect(lan.asked.every((one) => one.method === 'GET')).toBe(true);
  });

  it('adds nothing twice when run again, and fills in a secret typed in later', async () => {
    const { service, clientStore, indexerStore, profileStore, appStore } = anImport();

    await service.apply(ORDER);

    const again = await service.apply({
      ...ORDER,
      secrets: {
        ...ORDER.secrets,
        'client:sabnzbd@http://sabnzbd:8080/sabnzbd:apiKey': 'sab-key',
        'indexer:https://api.nzbgeek.info': 'geek-key',
      },
    });

    expect(again).toMatchObject({
      clients: { added: 0, kept: 3 },
      indexers: { added: 0, kept: 1 },
      profiles: { added: 0, kept: 3 },
      apps: { added: 0, kept: 2 },
      prowlarr: { added: 0, unchanged: 2 },
    });
    expect(await clientStore.list()).toHaveLength(3);
    expect(await profileStore.list()).toHaveLength(3);
    expect(await appStore.list()).toHaveLength(2);
    expect((await clientStore.list()).find((one) => one.kind === 'sabnzbd')?.apiKey).toBe(
      'sab-key',
    );
    expect(
      (await indexerStore.list()).find((one) => one.url === 'https://api.nzbgeek.info/api')?.apiKey,
    ).toBe('geek-key');
  });

  it('says which app could not be read, and brings in the rest', async () => {
    const { service } = anImport();
    const applied = await service.apply({
      ...ORDER,
      sources: [{ kind: 'sonarr' as const, url: 'http://elsewhere:8989', apiKey: 'key' }],
    });

    expect(applied.problems.map((one) => one.message)).toEqual([
      'Couldn’t read Sonarr: Couldn’t connect to Sonarr',
    ]);
    expect(applied.clients).toEqual({ added: 0, kept: 0 });
  });
});
