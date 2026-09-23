import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signUpForTest, makeAdministrator, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createRequestsMonitor } from '@ValenceServer/requests/createRequestsMonitor';
import { createRequestsClient } from '@ValenceServer/requests/createRequestsClient';
import { jobDefinitionsFor } from '@ValenceServer/jobs/jobDefinitions';
import {
  RequestsAvailabilitySchema,
  NO_WORK,
  RequestsOverviewSchema,
} from '@ValenceContracts/schemas/Requests';
import { ProfilesOnOfferSchema } from '@ValenceContracts/schemas/QualityProfile';
import type { RequestsStatus } from '@ValenceContracts/schemas/Requests';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type { Library } from '@ValenceContracts/schemas/Library';
import type {
  MusicCatalogueHit,
  MusicRequestKind,
  RequestCatalogue,
  VideoRequestKind,
} from '@ValenceContracts/schemas/MediaRequest';
import type { EventBus } from '@ValenceServer/events/EventBus';
import type { Discovery } from '@ValenceServer/requests/catalogue/Discovery';
import { NO_DISCOVERY } from '@ValenceServer/requests/catalogue/NO_DISCOVERY';

const A_STATUS: RequestsStatus = {
  version: '0.4.0',
  vpn: {
    isConfigured: true,
    isUp: true,
    publicAddress: '203.0.113.7',
    country: 'Netherlands',
    checkedAt: '2026-09-19T12:00:00.000Z',
    problem: null,
  },
  indexers: { total: 0, enabled: 0, failing: [] },
};

const AN_INDEXER = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Jackett',
  kind: 'torznab',
  url: 'http://jackett:9117/',
  hasApiKey: true,
  definitionId: null,
  settings: {},
  secretsSet: [],
  privacy: null,
  priority: 25,
  isEnabled: true,
  categories: [],
  requestsPerMinute: null,
  timeoutSeconds: 30,
  capabilities: null,
  failures: 0,
  lastProblem: null,
  lastFailedAt: null,
  turnedOffBecause: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const A_TEST = { isWorking: true, problem: null, capabilities: null, captcha: null };

/**
 * The requests service as it answers when everything goes well.
 */
const aWillingService = (url: string, init: { method?: string }): Response => {
  const answer = (status: number, body: object | null) =>
    new Response(body === null ? null : JSON.stringify(body), { status });
  const method = init.method ?? 'GET';

  if (url.endsWith('/api/search')) {
    return answer(200, { releases: [], indexers: [] });
  }

  if (url.endsWith('/api/definitions') || url.endsWith('/api/definitions/refresh')) {
    return answer(200, {
      definitions: [],
      updatedAt: null,
      source: 'Prowlarr/Indexers@master/definitions/v11',
      problem: null,
    });
  }

  if (url.includes('/api/definitions/')) {
    return answer(200, {
      id: '1337x',
      name: '1337x',
      description: '',
      language: 'en-US',
      privacy: 'public',
      protocol: 'torrent',
      categories: [],
      links: ['https://1337x.to/'],
      settings: [],
      standardCategories: [],
      hasCaptcha: false,
      needsFlareSolverr: false,
    });
  }

  if (url.endsWith('/download')) {
    return new Response(new Uint8Array([0x64, 0x65]), {
      headers: { 'content-type': 'application/x-bittorrent' },
    });
  }

  if (url.endsWith('/test') || url.endsWith('/try')) {
    return answer(200, A_TEST);
  }

  if (method === 'DELETE') {
    return answer(204, null);
  }

  if (method === 'POST') {
    return answer(201, AN_INDEXER);
  }

  return answer(200, url.endsWith('/api/indexers') ? [AN_INDEXER] : AN_INDEXER);
};

const FILMS: Library = {
  id: '9b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  name: 'Films',
  kind: 'movies',
  path: '/media/Films',
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
};

const MUSIC: Library = {
  id: '1c6a7e2b-3d4f-4a5b-9c8d-7e6f5a4b3c2d',
  name: 'Music',
  kind: 'music',
  path: '/media/Music',
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
};

const BOOKS: Library = {
  id: '5d7e9f1a-2b3c-4d5e-8f6a-7b8c9d0e1f2a',
  name: 'Books',
  kind: 'books',
  path: '/media/Books',
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
};

const build = async ({
  isOn,
  granted = [],
  isAdministrator = false,
  service = aWillingService,
  events,
  describeForRequest,
  describeMusicForRequest,
  describeBookForRequest,
  searchMusicCatalogue,
  discovery,
  libraries = [FILMS],
}: {
  isOn: boolean;
  granted?: readonly Permission[];
  isAdministrator?: boolean;
  service?: (url: string, init: { method?: string; body?: string }) => Response;
  events?: EventBus;
  describeForRequest?: (tmdbId: number, kind: VideoRequestKind) => Promise<RequestCatalogue | null>;
  describeMusicForRequest?: (
    musicBrainzId: string,
    kind: MusicRequestKind,
  ) => Promise<RequestCatalogue | null>;
  describeBookForRequest?: (openLibraryId: number) => Promise<RequestCatalogue | null>;
  searchMusicCatalogue?: (query: string, kind: MusicRequestKind) => Promise<MusicCatalogueHit[]>;
  discovery?: Discovery;
  libraries?: Library[];
}) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const readStatus = vi.fn(() => Promise.resolve({ kind: 'answered' as const, status: A_STATUS }));
  const requests = isOn
    ? createRequestsMonitor({
        address: 'http://requests:8421',
        client: { readStatus },
        onLost: vi.fn(),
        onRegained: vi.fn(),
        onVpnDown: vi.fn(),
        onVpnUp: vi.fn(),
      })
    : null;

  const app = createApp({
    auth,
    settings,
    permissions,
    requests,
    requestsClient: isOn
      ? createRequestsClient({
          address: 'http://requests:8421',
          secret: 'a-secret-long-enough-to-be-worth-keeping',
          fetch: (url, init) => Promise.resolve(service(url, init)),
        })
      : null,
    jobDefinitions: jobDefinitionsFor(isOn),
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({ libraries, media: [] }),
    ...(events === undefined ? {} : { events }),
    ...(describeForRequest === undefined ? {} : { describeForRequest }),
    ...(describeMusicForRequest === undefined ? {} : { describeMusicForRequest }),
    ...(describeBookForRequest === undefined ? {} : { describeBookForRequest }),
    ...(searchMusicCatalogue === undefined ? {} : { searchMusicCatalogue }),
    ...(discovery === undefined ? {} : { discovery }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });

  const cookie = await signUpForTest(app);
  const accountId = store.user[0]?.id ?? '';
  let roleId: string | null = null;

  if (isAdministrator) {
    await makeAdministrator(permissions, accountId);
  } else if (granted.length > 0) {
    const role = await permissions.createRole({
      name: 'Purpose-made',
      position: 200,
      color: null,
      permissions: [...granted],
    });

    await permissions.assignRole(accountId, role.id);

    roleId = role.id;
  }

  const ask = (path: string, method = 'GET', body?: object) =>
    app.request(`${TEST_ORIGIN}${path}`, {
      method,
      headers: {
        cookie,
        origin: TEST_ORIGIN,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  return { app, ask, readStatus, accountId, roleId };
};

describe('GET /api/requests/availability', () => {
  it('says requesting is on to anybody signed in', async () => {
    const { ask } = await build({ isOn: true });
    const response = await ask('/api/requests/availability');

    expect(response.status).toBe(200);
    expect(RequestsAvailabilitySchema.parse(await response.json())).toEqual({ isEnabled: true });
  });

  it('says requesting is off where the service was never set up', async () => {
    const { ask } = await build({ isOn: false });
    const response = await ask('/api/requests/availability');

    expect(RequestsAvailabilitySchema.parse(await response.json())).toEqual({ isEnabled: false });
  });

  it('refuses somebody who is not signed in', async () => {
    const { app } = await build({ isOn: true });
    const response = await app.request(`${TEST_ORIGIN}/api/requests/availability`, {
      headers: { origin: TEST_ORIGIN },
    });

    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/requests', () => {
  it('says what the server last heard to whoever manages requesting', async () => {
    const { ask } = await build({ isOn: true, granted: ['requests.manage'] });
    const response = await ask('/api/admin/requests');

    expect(response.status).toBe(200);
    expect(RequestsOverviewSchema.parse(await response.json())).toEqual({
      address: 'http://requests:8421',
      isReachable: false,
      checkedAt: null,
      status: null,
      work: NO_WORK,
    });
  });

  it('refuses somebody who may only approve requests', async () => {
    const { ask } = await build({ isOn: true, granted: ['requests.approve'] });

    expect((await ask('/api/admin/requests')).status).toBe(403);
  });

  it('says requesting is off rather than pretending there is a service', async () => {
    const { ask } = await build({ isOn: false, isAdministrator: true });

    expect((await ask('/api/admin/requests')).status).toBe(404);
  });
});

describe('POST /api/admin/requests/check', () => {
  it('asks the service now, and says what it said', async () => {
    const { ask, readStatus } = await build({ isOn: true, isAdministrator: true });
    const response = await ask('/api/admin/requests/check', 'POST');

    expect(response.status).toBe(200);
    expect(readStatus).toHaveBeenCalledTimes(1);
    expect(RequestsOverviewSchema.parse(await response.json())).toMatchObject({
      isReachable: true,
      status: A_STATUS,
    });
  });

  it('refuses somebody who does not manage requesting', async () => {
    const { ask, readStatus } = await build({ isOn: true, granted: ['requests.ask'] });

    expect((await ask('/api/admin/requests/check', 'POST')).status).toBe(403);
    expect(readStatus).not.toHaveBeenCalled();
  });

  it('says requesting is off', async () => {
    const { ask } = await build({ isOn: false, isAdministrator: true });

    expect((await ask('/api/admin/requests/check', 'POST')).status).toBe(404);
  });
});

describe('GET /api/admin/jobs/definitions', () => {
  it('offers the requests check only while requesting is on', async () => {
    const on = await build({ isOn: true, isAdministrator: true });
    const off = await build({ isOn: false, isAdministrator: true });
    const kindsFrom = async (response: Response) =>
      JSON.stringify(await response.json()).includes('server.checkRequests');

    expect(await kindsFrom(await on.ask('/api/admin/jobs/definitions'))).toBe(true);
    expect(await kindsFrom(await off.ask('/api/admin/jobs/definitions'))).toBe(false);
  });
});

describe('GET /api/admin/permissions', () => {
  it('offers the requests permissions only while requesting is on', async () => {
    const on = await build({ isOn: true, isAdministrator: true });
    const off = await build({ isOn: false, isAdministrator: true });
    const offersRequests = async (response: Response) =>
      JSON.stringify(await response.json()).includes('requests.ask');

    expect(await offersRequests(await on.ask('/api/admin/permissions'))).toBe(true);
    expect(await offersRequests(await off.ask('/api/admin/permissions'))).toBe(false);
  });
});

describe('indexers and searching, through the server', () => {
  const ID = AN_INDEXER.id;
  const DRAFT = { name: 'Jackett', kind: 'torznab', url: 'http://jackett:9117/', apiKey: 'a-key' };

  it('lists, adds, changes, tests, tries and removes indexers for whoever manages requesting', async () => {
    const { ask } = await build({ isOn: true, granted: ['requests.manage'] });

    expect((await ask('/api/admin/requests/indexers')).status).toBe(200);
    expect((await ask('/api/admin/requests/indexers', 'POST', DRAFT)).status).toBe(201);
    expect((await ask('/api/admin/requests/indexers/try', 'POST', DRAFT)).status).toBe(200);
    expect((await ask(`/api/admin/requests/indexers/${ID}`, 'PATCH', { priority: 3 })).status).toBe(
      200,
    );
    expect((await ask(`/api/admin/requests/indexers/${ID}/test`, 'POST')).status).toBe(200);
    expect((await ask(`/api/admin/requests/indexers/${ID}/try`, 'POST', DRAFT)).status).toBe(200);
    expect((await ask(`/api/admin/requests/indexers/${ID}`, 'DELETE')).status).toBe(204);
    expect((await ask('/api/admin/requests/search', 'POST', { query: 'dune' })).status).toBe(200);
  });

  it('asks the service how it is again once an indexer is added, changed, tested or removed', async () => {
    const { ask, readStatus } = await build({ isOn: true, granted: ['requests.manage'] });

    await ask('/api/admin/requests/indexers', 'POST', DRAFT);
    await ask(`/api/admin/requests/indexers/${ID}`, 'PATCH', { priority: 3 });
    await ask(`/api/admin/requests/indexers/${ID}/test`, 'POST');
    await ask(`/api/admin/requests/indexers/${ID}`, 'DELETE');

    expect(readStatus).toHaveBeenCalledTimes(4);

    await ask('/api/admin/requests/indexers');
    await ask('/api/admin/requests/indexers/try', 'POST', DRAFT);

    expect(readStatus).toHaveBeenCalledTimes(4);
  });

  it('never hands an indexer’s key back', async () => {
    const { ask } = await build({ isOn: true, isAdministrator: true });
    const listed = JSON.stringify(await (await ask('/api/admin/requests/indexers')).json());

    expect(listed).toContain('"hasApiKey":true');
    expect(listed).not.toContain('a-key');
  });

  it.each([
    ['GET', '/api/admin/requests/indexers', undefined],
    ['POST', '/api/admin/requests/indexers', DRAFT],
    ['POST', '/api/admin/requests/indexers/try', DRAFT],
    ['PATCH', `/api/admin/requests/indexers/${ID}`, { priority: 3 }],
    ['DELETE', `/api/admin/requests/indexers/${ID}`, undefined],
    ['POST', `/api/admin/requests/indexers/${ID}/test`, undefined],
    ['POST', `/api/admin/requests/indexers/${ID}/try`, DRAFT],
    ['POST', '/api/admin/requests/search', { query: 'dune' }],
  ])(
    'refuses %s %s to somebody who does not manage requesting, and while it is off',
    async (method, path, body) => {
      const refused = await build({ isOn: true, granted: ['requests.approve'] });
      const off = await build({ isOn: false, isAdministrator: true });

      expect((await refused.ask(path, method, body)).status).toBe(403);
      expect((await off.ask(path, method, body)).status).toBe(404);
    },
  );

  it.each([
    ['GET', '/api/admin/requests/indexers', undefined],
    ['POST', '/api/admin/requests/indexers', DRAFT],
    ['POST', '/api/admin/requests/indexers/try', DRAFT],
    ['PATCH', `/api/admin/requests/indexers/${ID}`, { priority: 3 }],
    ['DELETE', `/api/admin/requests/indexers/${ID}`, undefined],
    ['POST', `/api/admin/requests/indexers/${ID}/test`, undefined],
    ['POST', `/api/admin/requests/indexers/${ID}/try`, DRAFT],
    ['POST', '/api/admin/requests/search', { query: 'dune' }],
  ])('says %s %s could not reach a service that is down', async (method, path, body) => {
    const { ask } = await build({
      isOn: true,
      isAdministrator: true,
      service: () => new Response(null, { status: 503 }),
    });

    expect((await ask(path, method, body)).status).toBe(502);
  });

  it('passes on the service turning away an indexer it does not have', async () => {
    const { ask } = await build({
      isOn: true,
      isAdministrator: true,
      service: () => new Response(JSON.stringify({ error: 'No such indexer.' }), { status: 404 }),
    });

    for (const [method, path, body] of [
      ['PATCH', `/api/admin/requests/indexers/${ID}`, { priority: 3 }],
      ['DELETE', `/api/admin/requests/indexers/${ID}`, undefined],
      ['POST', `/api/admin/requests/indexers/${ID}/test`, undefined],
    ] as const) {
      const response = await ask(path, method, body);

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'No such indexer.' });
    }

    expect((await ask('/api/admin/requests/indexers')).status).toBe(502);
  });

  it('passes on the service refusing what it was sent', async () => {
    const { ask } = await build({
      isOn: true,
      isAdministrator: true,
      service: () =>
        new Response(JSON.stringify({ error: 'That is not an indexer.' }), { status: 400 }),
    });

    for (const [method, path, body] of [
      ['POST', '/api/admin/requests/indexers', DRAFT],
      ['POST', '/api/admin/requests/indexers/try', DRAFT],
      ['PATCH', `/api/admin/requests/indexers/${ID}`, { priority: 3 }],
      ['POST', `/api/admin/requests/indexers/${ID}/try`, DRAFT],
      ['POST', '/api/admin/requests/search', { query: 'dune' }],
    ] as const) {
      expect((await ask(path, method, body)).status).toBe(400);
    }
  });

  it('refuses a body that is not what the route takes, before asking the service', async () => {
    const { ask } = await build({ isOn: true, isAdministrator: true });

    expect((await ask('/api/admin/requests/indexers', 'POST', { name: 'x' })).status).toBe(400);
  });
});

describe('the catalogue and fetching releases, through the server', () => {
  const ID = AN_INDEXER.id;

  it('lists, refreshes and describes definitions for whoever manages requesting', async () => {
    const { ask } = await build({ isOn: true, granted: ['requests.manage'] });

    expect((await ask('/api/admin/requests/definitions')).status).toBe(200);
    expect((await ask('/api/admin/requests/definitions/refresh', 'POST')).status).toBe(200);
    expect((await ask('/api/admin/requests/definitions/1337x')).status).toBe(200);
  });

  it('fetches a release as a file to save', async () => {
    const { ask } = await build({ isOn: true, isAdministrator: true });
    const response = await ask(`/api/admin/requests/indexers/${ID}/download`, 'POST', {
      url: 'https://x/1',
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="release.torrent"',
    );
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([0x64, 0x65]));
  });

  it('names an NZB as one, and gives a magnet link as JSON', async () => {
    const nzb = await build({
      isOn: true,
      isAdministrator: true,
      service: () => new Response('<nzb/>', { headers: { 'content-type': 'application/x-nzb' } }),
    });

    expect(
      (
        await nzb.ask(`/api/admin/requests/indexers/${ID}/download`, 'POST', { url: 'x' })
      ).headers.get('content-disposition'),
    ).toBe('attachment; filename="release.nzb"');

    const magnet = await build({
      isOn: true,
      isAdministrator: true,
      service: () =>
        new Response(JSON.stringify({ magnet: 'magnet:?xt=urn:btih:A' }), {
          headers: { 'content-type': 'application/json' },
        }),
    });

    expect(
      await (
        await magnet.ask(`/api/admin/requests/indexers/${ID}/download`, 'POST', { url: 'x' })
      ).json(),
    ).toEqual({
      magnet: 'magnet:?xt=urn:btih:A',
    });
  });

  it('refuses to fetch without saying what, and passes on a refusal or a silence', async () => {
    const { ask } = await build({ isOn: true, isAdministrator: true });

    expect((await ask(`/api/admin/requests/indexers/${ID}/download`, 'POST', {})).status).toBe(400);

    const missing = await build({
      isOn: true,
      isAdministrator: true,
      service: () => new Response(JSON.stringify({ error: 'No such indexer.' }), { status: 404 }),
    });

    expect(
      (await missing.ask(`/api/admin/requests/indexers/${ID}/download`, 'POST', { url: 'x' }))
        .status,
    ).toBe(404);

    const down = await build({
      isOn: true,
      isAdministrator: true,
      service: () => new Response(null, { status: 503 }),
    });

    expect(
      (await down.ask(`/api/admin/requests/indexers/${ID}/download`, 'POST', { url: 'x' })).status,
    ).toBe(502);
    expect((await down.ask('/api/admin/requests/definitions')).status).toBe(502);
    expect((await down.ask('/api/admin/requests/definitions/refresh', 'POST')).status).toBe(502);
    expect((await down.ask('/api/admin/requests/definitions/x')).status).toBe(502);
    expect((await missing.ask('/api/admin/requests/definitions/x')).status).toBe(404);
  });

  it.each([
    ['GET', '/api/admin/requests/definitions'],
    ['POST', '/api/admin/requests/definitions/refresh'],
    ['GET', '/api/admin/requests/definitions/x'],
    ['POST', `/api/admin/requests/indexers/${AN_INDEXER.id}/download`],
  ])(
    'refuses %s %s to somebody who does not manage requesting, and while it is off',
    async (method, path) => {
      const refused = await build({ isOn: true, granted: ['requests.approve'] });
      const off = await build({ isOn: false, isAdministrator: true });

      const body = method === 'POST' ? { url: 'x' } : undefined;

      expect((await refused.ask(path, method, body)).status).toBe(403);
      expect((await off.ask(path, method, body)).status).toBe(404);
    },
  );
});

describe('download clients and the queue, through the server', () => {
  const CLIENT = {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    name: 'qBittorrent',
    kind: 'qbittorrent',
    url: 'http://qbittorrent:8080',
    username: 'admin',
    hasPassword: true,
    hasApiKey: false,
    remotePath: '',
    localPath: '',
    categories: {
      movies: 'valence-films',
      shows: 'valence-series',
      music: 'valence-music',
      books: 'valence-books',
    },
    priority: 25,
    isEnabled: true,
    createdAt: '2026-09-19T00:00:00.000Z',
    updatedAt: '2026-09-19T00:00:00.000Z',
  };

  const DOWNLOAD = {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    clientId: CLIENT.id,
    clientName: 'qBittorrent',
    protocol: 'torrent',
    libraryKind: 'movies',
    title: 'Dune',
    indexerName: 'Jackett',
    state: 'downloading',
    problem: null,
    progress: 0.5,
    sizeBytes: 1000,
    doneBytes: 500,
    downloadBytesPerSecond: 100,
    uploadBytesPerSecond: 5,
    secondsLeft: 5,
    seeds: 9,
    peers: 2,
    sentAt: '2026-09-19T00:00:00.000Z',
    finishedAt: null,
    filedInto: null,
    filingProblem: null,
  };

  const DRAFT = { name: 'qBittorrent', kind: 'qbittorrent', url: 'http://qbittorrent:8080' };

  const SEND = {
    indexerId: AN_INDEXER.id,
    url: 'magnet:?xt=urn:btih:x',
    title: 'Dune',
    protocol: 'torrent',
    libraryKind: 'movies',
  };

  const asked: string[] = [];

  /**
   * The requests service as it answers download questions when everything goes well.
   */
  const aWillingQueue = (url: string, init: { method?: string }): Response => {
    const answer = (status: number, body: object | null) =>
      new Response(body === null ? null : JSON.stringify(body), { status });
    const method = init.method ?? 'GET';

    asked.push(`${method} ${url}`);

    if (method === 'DELETE') {
      return answer(204, null);
    }

    if (url.endsWith('/test') || url.endsWith('/try')) {
      return answer(200, { isWorking: true, problem: null, version: 'v5.0.1' });
    }

    if (url.endsWith('/pause') || url.endsWith('/resume')) {
      return answer(200, DOWNLOAD);
    }

    if (url.endsWith('/api/downloads')) {
      return method === 'POST'
        ? answer(201, DOWNLOAD)
        : answer(200, { clients: [], downloads: [DOWNLOAD], checkedAt: null });
    }

    if (url.endsWith('/api/clients')) {
      return method === 'POST' ? answer(201, CLIENT) : answer(200, [CLIENT]);
    }

    return answer(200, CLIENT);
  };

  const ROUTES = [
    ['GET', '/api/admin/requests/clients', undefined, 200],
    ['POST', '/api/admin/requests/clients', DRAFT, 201],
    ['POST', '/api/admin/requests/clients/try', DRAFT, 200],
    ['PATCH', `/api/admin/requests/clients/${CLIENT.id}`, { priority: 3 }, 200],
    ['POST', `/api/admin/requests/clients/${CLIENT.id}/test`, undefined, 200],
    ['POST', `/api/admin/requests/clients/${CLIENT.id}/try`, DRAFT, 200],
    ['DELETE', `/api/admin/requests/clients/${CLIENT.id}`, undefined, 204],
    ['GET', '/api/admin/requests/downloads', undefined, 200],
    ['POST', '/api/admin/requests/downloads', SEND, 201],
    ['POST', `/api/admin/requests/downloads/${DOWNLOAD.id}/pause`, undefined, 200],
    ['POST', `/api/admin/requests/downloads/${DOWNLOAD.id}/resume`, undefined, 200],
    ['DELETE', `/api/admin/requests/downloads/${DOWNLOAD.id}?deleteData=true`, undefined, 204],
  ] as const;

  it.each(ROUTES)(
    'answers %s %s for whoever manages requesting',
    async (method, path, body, status) => {
      const { ask } = await build({
        isOn: true,
        granted: ['requests.manage'],
        service: aWillingQueue,
      });

      expect((await ask(path, method, body)).status).toBe(status);
    },
  );

  it('asks the service to delete what was downloaded only where asked', async () => {
    const { ask } = await build({ isOn: true, isAdministrator: true, service: aWillingQueue });

    asked.length = 0;
    await ask(`/api/admin/requests/downloads/${DOWNLOAD.id}?deleteData=true`, 'DELETE');
    await ask(`/api/admin/requests/downloads/${DOWNLOAD.id}`, 'DELETE');

    expect(asked).toStrictEqual([
      `DELETE http://requests:8421/api/downloads/${DOWNLOAD.id}?deleteData=true`,
      `DELETE http://requests:8421/api/downloads/${DOWNLOAD.id}?deleteData=false`,
    ]);
  });

  it('never hands a client’s password back', async () => {
    const { ask } = await build({ isOn: true, isAdministrator: true, service: aWillingQueue });
    const listed = JSON.stringify(await (await ask('/api/admin/requests/clients')).json());

    expect(listed).toContain('"hasPassword":true');
    expect(listed).not.toContain('password":"');
  });

  it.each(ROUTES)(
    'refuses %s %s to somebody who does not manage requesting, and while it is off',
    async (method, path, body) => {
      const refused = await build({
        isOn: true,
        granted: ['requests.approve'],
        service: aWillingQueue,
      });
      const off = await build({ isOn: false, isAdministrator: true });

      expect((await refused.ask(path, method, body)).status).toBe(403);
      expect((await off.ask(path, method, body)).status).toBe(404);
    },
  );

  it.each(ROUTES)(
    'says %s %s could not reach a service that is down',
    async (method, path, body) => {
      const { ask } = await build({
        isOn: true,
        isAdministrator: true,
        service: () => new Response(null, { status: 503 }),
      });

      expect((await ask(path, method, body)).status).toBe(502);
    },
  );

  it('passes on why a release was not sent, and a download the service does not have', async () => {
    const refusing = await build({
      isOn: true,
      isAdministrator: true,
      service: () =>
        new Response(JSON.stringify({ error: 'No torrent client is set up and switched on' }), {
          status: 400,
        }),
    });
    const sent = await refusing.ask('/api/admin/requests/downloads', 'POST', SEND);

    expect(sent.status).toBe(400);
    expect(await sent.json()).toEqual({ error: 'No torrent client is set up and switched on' });

    const missing = await build({
      isOn: true,
      isAdministrator: true,
      service: () => new Response(JSON.stringify({ error: 'No such download.' }), { status: 404 }),
    });

    expect(
      (await missing.ask(`/api/admin/requests/downloads/${DOWNLOAD.id}/pause`, 'POST')).status,
    ).toBe(404);
  });

  it('files a download into any library there is, and not into one there is not', async () => {
    const libraries: Array<{ id: string; path: string }> = [];
    const { ask } = await build({
      isOn: true,
      isAdministrator: true,
      libraries: [FILMS, MUSIC, BOOKS],
      service: (url, init) => {
        if (url.endsWith('/file')) {
          libraries.push(
            z
              .object({ library: z.object({ id: z.string(), path: z.string() }) })
              .parse(JSON.parse(init.body ?? '{}')).library,
          );

          return new Response(JSON.stringify(DOWNLOAD), { status: 200 });
        }

        return aWillingQueue(url, init);
      },
    });

    const filed = await ask(`/api/admin/requests/downloads/${DOWNLOAD.id}/file`, 'POST', {
      libraryId: FILMS.id,
    });

    expect(filed.status).toBe(200);

    await ask(`/api/admin/requests/downloads/${DOWNLOAD.id}/file`, 'POST', {
      libraryId: MUSIC.id,
    });
    await ask(`/api/admin/requests/downloads/${DOWNLOAD.id}/file`, 'POST', {
      libraryId: BOOKS.id,
    });

    expect(libraries).toEqual([
      { id: FILMS.id, path: '/media/Films' },
      { id: MUSIC.id, path: '/media/Music' },
      { id: BOOKS.id, path: '/media/Books' },
    ]);
    expect(
      await (
        await ask(`/api/admin/requests/downloads/${DOWNLOAD.id}/file`, 'POST', {
          libraryId: 'elsewhere',
        })
      ).json(),
    ).toEqual({ error: 'There is no such library.' });
  });

  it('sends a release for the library of its kind it will be filed into, and for none where there is none', async () => {
    const libraries: Array<{ id: string; path: string } | null> = [];
    const { ask } = await build({
      isOn: true,
      isAdministrator: true,
      libraries: [FILMS, MUSIC, BOOKS],
      service: (url, init) => {
        libraries.push(
          z
            .object({ library: z.object({ id: z.string(), path: z.string() }).nullable() })
            .parse(JSON.parse(init.body ?? '{}')).library,
        );

        return aWillingQueue(url, init);
      },
    });

    await ask('/api/admin/requests/downloads', 'POST', SEND);
    await ask('/api/admin/requests/downloads', 'POST', { ...SEND, libraryId: 'elsewhere' });
    await ask('/api/admin/requests/downloads', 'POST', { ...SEND, libraryKind: 'shows' });
    await ask('/api/admin/requests/downloads', 'POST', {
      ...SEND,
      libraryKind: 'music',
      library: { id: 'x', path: '/etc' },
    });
    await ask('/api/admin/requests/downloads', 'POST', { ...SEND, libraryKind: 'books' });

    expect(libraries).toEqual([
      { id: FILMS.id, path: '/media/Films' },
      null,
      null,
      { id: MUSIC.id, path: '/media/Music' },
      { id: BOOKS.id, path: '/media/Books' },
    ]);
  });

  it('refuses a release that is not one before asking the service', async () => {
    const { ask } = await build({ isOn: true, isAdministrator: true, service: aWillingQueue });

    asked.length = 0;

    expect((await ask('/api/admin/requests/downloads', 'POST', { title: 'Dune' })).status).toBe(
      400,
    );
    expect(asked).toStrictEqual([]);
  });
});

describe('quality profiles, through the server', () => {
  const PROFILE = {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    name: 'HD',
    kind: 'video',
    resolutions: ['1080p'],
    sources: ['bluray'],
    musicQualities: [],
    smallestMb: null,
    largestMb: null,
    preferredWords: [],
    requiredWords: [],
    bannedWords: [],
    isUpgrading: false,
    releaseWait: 'digital',
    sizes: [],
    upgradeUntilResolution: null,
    upgradeUntilSource: null,
    upgradeUntilMusicQuality: null,
    libraryIds: [],
    preferredLanguage: null,
    isDefault: false,
    roleIds: [],
    accountIds: [],
    createdAt: '2026-09-19T00:00:00.000Z',
    updatedAt: '2026-09-19T00:00:00.000Z',
  };

  /**
   * The requests service as it answers profile questions when everything goes well.
   */
  const aWillingKeeper = (url: string, init: { method?: string }): Response => {
    const method = init.method ?? 'GET';

    if (method === 'DELETE') {
      return new Response(null, { status: 204 });
    }

    if (url.endsWith('/api/profiles')) {
      return method === 'POST'
        ? new Response(JSON.stringify(PROFILE), { status: 201 })
        : new Response(JSON.stringify([PROFILE]), { status: 200 });
    }

    return new Response(JSON.stringify(PROFILE), { status: 200 });
  };

  const ROUTES = [
    ['GET', '/api/admin/requests/profiles', undefined, 200],
    ['POST', '/api/admin/requests/profiles', { name: 'HD', kind: 'video' }, 201],
    ['PATCH', `/api/admin/requests/profiles/${PROFILE.id}`, { name: 'UHD' }, 200],
    ['DELETE', `/api/admin/requests/profiles/${PROFILE.id}`, undefined, 204],
  ] as const;

  it.each(ROUTES)(
    'answers %s %s for whoever manages requesting',
    async (method, path, body, status) => {
      const { ask } = await build({
        isOn: true,
        granted: ['requests.manage'],
        service: aWillingKeeper,
      });

      expect((await ask(path, method, body)).status).toBe(status);
    },
  );

  it.each(ROUTES)(
    'refuses %s %s to somebody who does not manage requesting, and while it is off',
    async (method, path, body) => {
      const refused = await build({
        isOn: true,
        granted: ['requests.approve'],
        service: aWillingKeeper,
      });
      const off = await build({ isOn: false, isAdministrator: true });

      expect((await refused.ask(path, method, body)).status).toBe(403);
      expect((await off.ask(path, method, body)).status).toBe(404);
    },
  );

  it('passes on a profile the service does not have, and one it will not take', async () => {
    const missing = await build({
      isOn: true,
      isAdministrator: true,
      service: () => new Response(JSON.stringify({ error: 'No such profile.' }), { status: 404 }),
    });

    expect((await missing.ask(`/api/admin/requests/profiles/${PROFILE.id}`, 'DELETE')).status).toBe(
      404,
    );
    expect((await missing.ask('/api/admin/requests/profiles', 'POST', { name: 'x' })).status).toBe(
      400,
    );
  });
});

describe('requests for films and series, through the server', () => {
  const REQUEST = {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    kind: 'film',
    tmdbId: 438631,
    musicBrainzId: null,
    openLibraryId: null,
    title: 'Dune',
    artistName: null,
    year: 2021,
    overview: null,
    posterUrl: null,
    libraryId: FILMS.id,
    profileId: null,
    profileName: null,
    isPickedByHand: false,
    state: 'wanted',
    problem: null,
    approval: 'approved',
    refusedBecause: 'No room',
    requestedBy: { id: 'someone-else', name: 'Someone' },
    seasons: null,
    releaseTypes: null,
    releaseDate: '2021-12-03',
    items: [],
    mediaId: null,
    createdAt: '2026-09-19T00:00:00.000Z',
    updatedAt: '2026-09-19T00:00:00.000Z',
  };

  const DUNE: RequestCatalogue = {
    title: 'Dune',
    year: 2021,
    aliases: [],
    overview: null,
    posterUrl: null,
    runtimeMinutes: 155,
    releaseDates: { theatrical: null, digital: '2021-12-03', physical: null },
    episodes: [],
    isEnded: false,
    artist: null,
    albums: [],
  };

  const SECOND_ID = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

  const sent: Array<{ method: string; url: string; body: string | undefined }> = [];

  const PROFILES: QualityProfile[] = [];

  /**
   * What was sent to a path, as it was written. Found by path rather than by position, because
   * every ask reads the profiles first and counting calls would be counting something else.
   *
   * @param ending - What the path ends with.
   * @returns The body, or an empty object where nothing was sent there.
   */
  const bodySentTo = (ending: string): string =>
    sent.find(({ url }) => url.endsWith(ending))?.body ?? '{}';

  /**
   * A profile for HD video that nobody is named on, with whatever a test cares about changed.
   *
   * @param id - Its id.
   * @param name - What it is called.
   * @param extra - What to change.
   * @returns The profile.
   */
  const aProfile = (
    id: string,
    name: string,
    extra: Partial<QualityProfile> = {},
  ): QualityProfile => ({
    id,
    name,
    kind: 'video',
    resolutions: [],
    sources: [],
    musicQualities: [],
    smallestMb: null,
    largestMb: null,
    sizes: [],
    preferredWords: [],
    requiredWords: [],
    bannedWords: [],
    isUpgrading: false,
    releaseWait: 'digital',
    upgradeUntilResolution: null,
    upgradeUntilSource: null,
    upgradeUntilMusicQuality: null,
    libraryIds: [],
    preferredLanguage: null,
    isDefault: false,
    roleIds: [],
    accountIds: [],
    createdAt: '2026-09-19T00:00:00.000Z',
    updatedAt: '2026-09-19T00:00:00.000Z',
    ...extra,
  });

  /**
   * The requests service as it answers questions about requests when everything goes well.
   */
  const aWillingKeeper = (url: string, init: { method?: string; body?: string }): Response => {
    const method = init.method ?? 'GET';

    sent.push({ method, url, body: init.body });

    if (method === 'DELETE') {
      return new Response(null, { status: 204 });
    }

    if (url.endsWith('/api/requests/missing')) {
      return Response.json({ searched: 1, startedAt: '2026-09-19T00:00:00.000Z' });
    }

    if (url.includes('/blocklist')) {
      return Response.json([
        {
          id: '9f2504e0-4f89-41d3-9a0c-0305e82c3309',
          requestId: REQUEST.id,
          title: 'Dune.2021.2160p',
          indexerId: null,
          reason: 'It stalled',
          at: '2026-09-19T00:00:00.000Z',
        },
      ]);
    }

    if (url.endsWith('/log')) {
      return Response.json([{ id: 1, at: '2026-09-19T00:00:00.000Z', message: 'Searched.' }]);
    }

    if (url.endsWith('/api/profiles')) {
      return Response.json(PROFILES);
    }

    if (url.endsWith('/releases')) {
      return Response.json({ releases: [], indexers: [], judgements: [], pickedId: null });
    }

    if (url.endsWith('/api/requests')) {
      return method === 'POST'
        ? Response.json({ request: REQUEST, isNew: true }, { status: 201 })
        : Response.json([REQUEST, { ...REQUEST, requestedBy: { id: 'x', name: 'X' } }]);
    }

    return Response.json(REQUEST);
  };

  const RELEASE = {
    id: 'x',
    title: 'Dune.2021.1080p.WEB-DL',
    indexerId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    indexerName: 'Jackett',
    protocol: 'torrent',
    sizeBytes: null,
    seeders: 1,
    leechers: 0,
    grabs: null,
    publishedAt: null,
    categories: [],
    downloadUrl: null,
    magnetUrl: 'magnet:?xt=urn:btih:abc',
    infoUrl: null,
    infoHash: null,
  };

  it('asks for a film in the films library, as whoever is signed in, approved where they may', async () => {
    const published = vi.fn(() => Promise.resolve());
    const { ask, accountId } = await build({
      isOn: true,
      granted: ['requests.ask', 'requests.autoApprove'],
      service: aWillingKeeper,
      events: { publish: published },
      describeForRequest: () => Promise.resolve(DUNE),
    });

    sent.length = 0;

    const made = await ask('/api/requests/media', 'POST', { kind: 'film', tmdbId: 438631 });

    expect(made.status).toBe(201);
    expect(JSON.parse(bodySentTo('/api/requests'))).toMatchObject({
      libraryId: FILMS.id,
      libraryPath: '/media/Films',
      isApproved: true,
      requestedBy: { id: accountId },
      catalogue: { title: 'Dune' },
    });
    expect(published).toHaveBeenCalledWith({
      event: 'requests.made',
      data: { title: 'Dune', kind: 'film', requestedBy: 'Someone' },
    });
    expect(published).toHaveBeenCalledWith({
      event: 'requests.approved',
      data: { title: 'Dune', approvedBy: null },
    });
  });

  it('refuses to ask for what the catalogue does not know, or where there is no library for it', async () => {
    const unknown = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: aWillingKeeper,
    });

    expect(
      await (await unknown.ask('/api/requests/media', 'POST', { kind: 'film', tmdbId: 1 })).json(),
    ).toEqual({ error: 'The catalogue does not know that, or cannot be asked just now.' });

    const nowhere = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: aWillingKeeper,
      describeForRequest: () => Promise.resolve(DUNE),
    });

    expect(
      await (
        await nowhere.ask('/api/requests/media', 'POST', { kind: 'series', tmdbId: 1 })
      ).json(),
    ).toEqual({ error: 'There is no library of series to put it in.' });
    expect(
      (await nowhere.ask('/api/requests/media', 'POST', { kind: 'film', tmdbId: 1 })).status,
    ).toBe(201);
  });

  it('watches an artist, described by MusicBrainz, into the music library', async () => {
    const describeMusicForRequest = vi.fn(() =>
      Promise.resolve({ ...DUNE, title: 'Pink Floyd', artist: 'Pink Floyd' }),
    );
    const { ask } = await build({
      isOn: true,
      granted: ['requests.askMusic'],
      service: aWillingKeeper,
      describeMusicForRequest,
      libraries: [FILMS, MUSIC],
    });

    sent.length = 0;

    expect(
      (await ask('/api/requests/media', 'POST', { kind: 'film', tmdbId: 438631 })).status,
    ).toBe(403);

    const made = await ask('/api/requests/media', 'POST', {
      kind: 'artist',
      musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
      releaseTypes: ['album', 'live'],
    });

    expect(made.status).toBe(201);
    expect(describeMusicForRequest).toHaveBeenCalledWith(
      '83d91898-7763-47d7-b03b-b92132375c47',
      'artist',
    );
    expect(JSON.parse(bodySentTo('/api/requests'))).toMatchObject({
      kind: 'artist',
      tmdbId: null,
      musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
      releaseTypes: ['album', 'live'],
      libraryId: MUSIC.id,
      libraryPath: '/media/Music',
      catalogue: { title: 'Pink Floyd', artist: 'Pink Floyd' },
    });

    const filmsOnly = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: aWillingKeeper,
      describeMusicForRequest,
      libraries: [FILMS, MUSIC],
    });

    expect(
      (
        await filmsOnly.ask('/api/requests/media', 'POST', {
          kind: 'artist',
          musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
        })
      ).status,
    ).toBe(403);

    const nowhere = await build({
      isOn: true,
      granted: ['requests.askMusic'],
      service: aWillingKeeper,
      describeMusicForRequest,
    });

    expect(
      await (
        await nowhere.ask('/api/requests/media', 'POST', {
          kind: 'album',
          musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
        })
      ).json(),
    ).toEqual({ error: 'There is no library of music to put it in.' });
  });

  it('searches MusicBrainz for artists and albums, for whoever may ask', async () => {
    const hit: MusicCatalogueHit = {
      kind: 'artist',
      musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
      title: 'Pink Floyd',
      artist: null,
      disambiguation: 'UK rock band',
      type: null,
      year: 1965,
      coverUrl: null,
    };
    const searchMusicCatalogue = vi.fn(() => Promise.resolve([hit]));
    const asking = await build({
      isOn: true,
      granted: ['requests.askMusic'],
      searchMusicCatalogue,
    });

    const found = await asking.ask('/api/requests/catalogue/music?query=pink%20floyd&kind=artist');

    expect(found.status).toBe(200);
    expect(await found.json()).toEqual([hit]);
    expect(searchMusicCatalogue).toHaveBeenCalledWith('pink floyd', 'artist');

    const nobody = await build({ isOn: true, searchMusicCatalogue });

    expect(
      (await nobody.ask('/api/requests/catalogue/music?query=pink%20floyd&kind=artist')).status,
    ).toBe(403);
  });

  it('says where each season stands against what has already been asked', async () => {
    const anEpisode = (id: string, season: number, episode: number, state: 'filed' | 'wanted') => ({
      id,
      musicBrainzId: null,
      season,
      episode,
      title: '',
      airDate: null,
      state,
      problem: null,
      releaseTitle: null,
      downloadId: null,
      filePath: null,
      score: null,
      downloadedBytes: null,
      downloadSeconds: null,
      lastSearchedAt: null,
      updatedAt: '2026-09-19T00:00:00.000Z',
    });

    const asking = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: (url: string, init: { method?: string }) =>
        url.endsWith('/api/requests') && (init.method ?? 'GET') === 'GET'
          ? Response.json([
              {
                ...REQUEST,
                kind: 'series',
                tmdbId: 95396,
                items: [
                  anEpisode('7c9e6679-7425-40de-944b-e07fc1f90ae7', 1, 1, 'filed'),
                  anEpisode('1b4e28ba-2fa1-11d2-883f-0016d3cca427', 1, 2, 'wanted'),
                ],
              },
              { ...REQUEST, kind: 'series', tmdbId: 1399, items: [] },
            ])
          : Response.json({}),
      describeForRequest: () =>
        Promise.resolve({
          ...DUNE,
          episodes: [
            { season: 1, episode: 1, title: '', airDate: '2022-02-18' },
            { season: 1, episode: 2, title: '', airDate: '2022-02-25' },
            { season: 2, episode: 1, title: '', airDate: null },
          ],
        }),
    });

    expect(await (await asking.ask('/api/requests/catalogue/series/95396/seasons')).json()).toEqual(
      [
        { season: 1, episodeCount: 2, firstAired: '2022-02-18', standing: 'partly' },
        { season: 2, episodeCount: 1, firstAired: null, standing: 'askable' },
      ],
    );
  });

  it('says a season the library already holds is here, whoever fetched it', async () => {
    const asking = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: aWillingKeeper,
      discovery: {
        ...NO_DISCOVERY,
        lookup: {
          ...NO_DISCOVERY.lookup,
          episodesHeld: (tmdbId: string) =>
            Promise.resolve(tmdbId === '95396' ? new Map([[1, 2]]) : new Map<number, number>()),
        },
      },
      describeForRequest: () =>
        Promise.resolve({
          ...DUNE,
          episodes: [
            { season: 1, episode: 1, title: '', airDate: '2022-02-18' },
            { season: 1, episode: 2, title: '', airDate: '2022-02-25' },
            { season: 2, episode: 1, title: '', airDate: null },
          ],
        }),
    });

    expect(await (await asking.ask('/api/requests/catalogue/series/95396/seasons')).json()).toEqual(
      [
        { season: 1, episodeCount: 2, firstAired: '2022-02-18', standing: 'library' },
        { season: 2, episodeCount: 1, firstAired: null, standing: 'askable' },
      ],
    );
  });

  it('lists the seasons a series has for whoever may ask', async () => {
    const asking = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: aWillingKeeper,
      describeForRequest: () =>
        Promise.resolve({
          ...DUNE,
          episodes: [
            { season: 1, episode: 1, title: '', airDate: '2022-02-18' },
            { season: 0, episode: 1, title: '', airDate: null },
          ],
        }),
    });

    expect(await (await asking.ask('/api/requests/catalogue/series/95396/seasons')).json()).toEqual(
      [
        { season: 0, episodeCount: 1, firstAired: null, standing: 'askable' },
        { season: 1, episodeCount: 1, firstAired: '2022-02-18', standing: 'askable' },
      ],
    );

    const unknown = await build({ isOn: true, granted: ['requests.ask'], service: aWillingKeeper });

    expect((await unknown.ask('/api/requests/catalogue/series/1/seasons')).status).toBe(404);

    const nobody = await build({ isOn: true, service: aWillingKeeper });

    expect((await nobody.ask('/api/requests/catalogue/series/1/seasons')).status).toBe(403);
  });

  it('searches by hand before asking, and asks with the release picked, for whoever manages', async () => {
    const { ask } = await build({
      isOn: true,
      granted: ['requests.manage', 'requests.ask'],
      service: aWillingKeeper,
      describeForRequest: () => Promise.resolve(DUNE),
    });

    sent.length = 0;

    expect(
      (await ask('/api/requests/media/releases', 'POST', { kind: 'film', tmdbId: 1 })).status,
    ).toBe(200);
    expect(sent.map(({ method, url }) => `${method} ${url}`)).toEqual([
      'GET http://requests:8421/api/profiles',
      'POST http://requests:8421/api/requests/releases',
    ]);

    sent.length = 0;

    const made = await ask('/api/requests/media', 'POST', {
      kind: 'film',
      tmdbId: 438631,
      isPickedByHand: true,
      release: RELEASE,
    });

    expect(made.status).toBe(201);
    expect(sent.map(({ method, url }) => `${method} ${url}`)).toEqual([
      'GET http://requests:8421/api/profiles',
      'POST http://requests:8421/api/requests',
      `POST http://requests:8421/api/requests/${REQUEST.id}/pick`,
    ]);
    expect(JSON.parse(bodySentTo('/api/requests'))).not.toHaveProperty('release');
  });

  it('says a release picked on asking could not be fetched, and keeps picking to managers', async () => {
    const picking = await build({
      isOn: true,
      granted: ['requests.manage', 'requests.ask'],
      service: (url, init) =>
        url.endsWith('/pick')
          ? new Response(JSON.stringify({ error: 'No torrent client is set up' }), { status: 400 })
          : aWillingKeeper(url, init),
      describeForRequest: () => Promise.resolve(DUNE),
    });

    expect(
      await (
        await picking.ask('/api/requests/media', 'POST', {
          kind: 'film',
          tmdbId: 438631,
          release: RELEASE,
        })
      ).json(),
    ).toEqual({
      error: 'It was asked for, but that release could not be fetched: No torrent client is set up',
    });

    const asking = await build({ isOn: true, granted: ['requests.ask'], service: aWillingKeeper });

    expect(
      (
        await asking.ask('/api/requests/media', 'POST', {
          kind: 'film',
          tmdbId: 1,
          isPickedByHand: true,
        })
      ).status,
    ).toBe(403);
    expect(
      (await asking.ask('/api/requests/media/releases', 'POST', { kind: 'film', tmdbId: 1 }))
        .status,
    ).toBe(403);
  });

  it('refuses asking to somebody who may not ask', async () => {
    const { ask } = await build({ isOn: true, service: aWillingKeeper });

    expect((await ask('/api/requests/media', 'POST', { kind: 'film', tmdbId: 1 })).status).toBe(
      403,
    );
  });

  it('shows somebody who asks only their own requests, and an approver every one', async () => {
    const asker = await build({ isOn: true, granted: ['requests.ask'], service: aWillingKeeper });
    const approver = await build({
      isOn: true,
      granted: ['requests.approve'],
      service: aWillingKeeper,
    });

    expect(await (await asker.ask('/api/requests/media')).json()).toEqual([]);
    expect(await (await approver.ask('/api/requests/media')).json()).toHaveLength(2);
  });

  it('approves and refuses for whoever approves, saying so', async () => {
    const published = vi.fn(() => Promise.resolve());
    const { ask } = await build({
      isOn: true,
      granted: ['requests.approve'],
      service: aWillingKeeper,
      events: { publish: published },
    });

    expect((await ask(`/api/requests/media/${REQUEST.id}/approve`, 'POST')).status).toBe(200);
    expect(
      (await ask(`/api/requests/media/${REQUEST.id}/refuse`, 'POST', { reason: 'No room' })).status,
    ).toBe(200);
    expect(published).toHaveBeenCalledWith({
      event: 'requests.approved',
      data: { title: 'Dune', approvedBy: 'Marques' },
    });
    expect(published).toHaveBeenCalledWith({
      event: 'requests.refused',
      data: { title: 'Dune', reason: 'No room' },
    });
    expect((await ask(`/api/requests/media/${REQUEST.id}/retry`, 'POST')).status).toBe(403);
  });

  it('decides several at once, saying which could not be', async () => {
    const stubborn = (url: string, init: { method?: string; body?: string }): Response =>
      url.includes(`${SECOND_ID}/approve`)
        ? Response.json({ error: 'No such request.' }, { status: 404 })
        : aWillingKeeper(url, init);

    const { ask } = await build({
      isOn: true,
      granted: ['requests.approve'],
      service: stubborn,
    });

    const decided = await ask('/api/requests/media/decide', 'POST', {
      ids: [REQUEST.id, SECOND_ID],
      decision: 'approve',
    });

    expect(decided.status).toBe(200);
    expect(await decided.json()).toMatchObject({
      decided: [{ id: REQUEST.id }],
      refused: [{ id: SECOND_ID }],
    });

    const asker = await build({ isOn: true, granted: ['requests.ask'], service: aWillingKeeper });

    expect(
      (
        await asker.ask('/api/requests/media/decide', 'POST', {
          ids: [REQUEST.id],
          decision: 'refuse',
          reason: 'No room',
        })
      ).status,
    ).toBe(403);
  });

  it('lists what a request will not try again, and lets it be tried again', async () => {
    const { ask } = await build({
      isOn: true,
      granted: ['requests.approve'],
      service: aWillingKeeper,
    });

    expect(await (await ask(`/api/requests/media/${REQUEST.id}/blocklist`)).json()).toMatchObject([
      { title: 'Dune.2021.2160p', reason: 'It stalled' },
    ]);

    sent.length = 0;

    const lifted = await ask(
      `/api/requests/media/${REQUEST.id}/blocklist/9f2504e0-4f89-41d3-9a0c-0305e82c3309`,
      'DELETE',
    );

    expect(lifted.status).toBe(204);
    expect(sent.at(-1)?.method).toBe('DELETE');

    const asker = await build({ isOn: true, granted: ['requests.ask'], service: aWillingKeeper });

    expect((await asker.ask(`/api/requests/media/${REQUEST.id}/blocklist`)).status).toBe(403);
  });

  it('changes the seasons asked for with what the catalogue says now', async () => {
    const { ask } = await build({
      isOn: true,
      granted: ['requests.approve'],
      service: aWillingKeeper,
      describeForRequest: () => Promise.resolve(DUNE),
    });

    sent.length = 0;

    expect((await ask(`/api/requests/media/${REQUEST.id}`, 'PATCH', { seasons: [1] })).status).toBe(
      200,
    );
    expect(JSON.parse(sent.at(-1)?.body ?? '{}')).toMatchObject({
      change: { seasons: [1] },
      catalogue: { title: 'Dune' },
    });
    expect(
      (await ask(`/api/requests/media/${REQUEST.id}`, 'PATCH', { isPickedByHand: true })).status,
    ).toBe(200);
  });

  it('passes on a request the service does not have when changing its seasons', async () => {
    const { ask } = await build({
      isOn: true,
      granted: ['requests.approve'],
      service: () => new Response(JSON.stringify({ error: 'No such request.' }), { status: 404 }),
    });

    expect((await ask(`/api/requests/media/${REQUEST.id}`, 'PATCH', { seasons: [1] })).status).toBe(
      404,
    );
  });

  it('retries, searches by hand, picks, removes, and searches for everything missing, for whoever manages requesting', async () => {
    const { ask } = await build({
      isOn: true,
      granted: ['requests.manage'],
      service: aWillingKeeper,
    });

    expect((await ask(`/api/requests/media/${REQUEST.id}/retry`, 'POST')).status).toBe(200);
    expect((await ask(`/api/requests/media/${REQUEST.id}/releases`)).status).toBe(200);
    expect(await (await ask(`/api/requests/media/${REQUEST.id}/log`)).json()).toMatchObject([
      { message: 'Searched.' },
    ]);
    expect(
      (await ask(`/api/requests/media/${REQUEST.id}/pick`, 'POST', { release: RELEASE })).status,
    ).toBe(200);
    expect((await ask(`/api/requests/media/${REQUEST.id}`, 'DELETE')).status).toBe(204);
    expect(await (await ask('/api/requests/media/missing', 'POST')).json()).toEqual({
      searched: 1,
      startedAt: '2026-09-19T00:00:00.000Z',
    });
  });

  const DISCOVERY: Discovery = {
    ...NO_DISCOVERY,
    genres: (kind) =>
      Promise.resolve(
        kind === 'movie'
          ? [
              { id: '28', name: 'Action' },
              { id: '878', name: 'Science Fiction' },
            ]
          : [{ id: '18', name: 'Drama' }],
      ),
    browse: ({ list, kind, filters }) =>
      Promise.resolve({
        matches:
          filters?.genre === '878'
            ? [
                {
                  externalId: '438631',
                  kind,
                  title: 'Dune',
                  year: 2021,
                  overview: null,
                  posterUrl: null,
                },
              ]
            : list === 'trending' && kind === 'movie'
              ? [
                  {
                    externalId: '438631',
                    kind,
                    title: 'Dune',
                    year: 2021,
                    overview: null,
                    posterUrl: null,
                  },
                ]
              : [],
        hasMore: list === 'trending',
      }),
    studios: () =>
      Promise.resolve([{ id: '2', name: 'Walt Disney Pictures', logoUrl: 'https://p/d.png' }]),
    charts: () =>
      Promise.resolve({
        albums: [{ deezerId: 7, title: 'Pylon', artist: 'Band', coverUrl: null }],
        artists: [],
      }),
    describeTitle: (tmdbId) =>
      Promise.resolve(
        tmdbId === '438631'
          ? {
              title: 'Dune',
              year: 2021,
              overview: 'Spice.',
              posterUrl: null,
              backdropUrl: null,
              genres: ['Science Fiction'],
              runtimeMinutes: 155,
              cast: [],
              trailerKey: null,
            }
          : null,
      ),
    lookup: {
      ...NO_DISCOVERY.lookup,
      films: (ids) => Promise.resolve(new Map(ids.includes('1') ? [['1', 'media-1']] : [])),
    },
  };

  it('shelves what a viewer may ask for, saying where each title stands', async () => {
    const films = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: aWillingKeeper,
      discovery: DISCOVERY,
    });
    const discovered = z
      .object({
        shelves: z.array(
          z.object({
            id: z.string(),
            titles: z.array(z.object({ standing: z.object({ status: z.string() }) })),
          }),
        ),
        studios: z.array(z.object({ id: z.string() })),
      })
      .parse(await (await films.ask('/api/requests/discover')).json());

    expect(discovered.shelves.map((shelf) => shelf.id)).toEqual(['trending-films']);
    expect(discovered.shelves[0]?.titles[0]?.standing.status).toBe('requested');
    expect(discovered.studios).toEqual([{ id: '2' }]);

    const music = await build({
      isOn: true,
      granted: ['requests.askMusic'],
      service: aWillingKeeper,
      discovery: DISCOVERY,
    });

    expect(await (await music.ask('/api/requests/discover')).json()).toMatchObject({
      shelves: [
        { id: 'popular-albums', titles: [{ id: 'deezer-7', standing: { status: 'askable' } }] },
      ],
      studios: [],
    });

    const nobody = await build({ isOn: true, service: aWillingKeeper, discovery: DISCOVERY });

    expect((await nobody.ask('/api/requests/discover')).status).toBe(403);
  });

  it('browses a whole list a page at a time, saying whether there is more', async () => {
    const { ask } = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: aWillingKeeper,
      discovery: DISCOVERY,
    });

    expect(
      await (await ask('/api/requests/catalogue/browse?kind=film&list=trending&page=1')).json(),
    ).toMatchObject({
      titles: [{ id: '438631', standing: { status: 'requested' } }],
      page: 1,
      hasMore: true,
    });
    expect(
      await (await ask('/api/requests/catalogue/browse?kind=series&list=popular')).json(),
    ).toMatchObject({ titles: [], hasMore: false });

    const music = await build({
      isOn: true,
      granted: ['requests.askMusic'],
      service: aWillingKeeper,
      discovery: DISCOVERY,
    });

    expect((await music.ask('/api/requests/catalogue/browse?kind=film&list=popular')).status).toBe(
      403,
    );
  });

  it('narrows a whole list by genre, years and rating, passing them to the catalogue', async () => {
    const browse = vi.fn<Discovery['browse']>(() =>
      Promise.resolve({ matches: [], hasMore: false }),
    );
    const { ask } = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: aWillingKeeper,
      discovery: { ...DISCOVERY, browse },
    });

    await ask(
      '/api/requests/catalogue/browse?kind=film&list=popular&genre=878&yearFrom=1990&yearTo=1999&minRating=7',
    );

    expect(browse).toHaveBeenCalledWith({
      list: 'popular',
      kind: 'movie',
      page: 1,
      studio: null,
      filters: { genre: '878', yearFrom: 1990, yearTo: 1999, minRating: 7 },
    });
  });

  it('narrows nothing where nothing was asked', async () => {
    const browse = vi.fn<Discovery['browse']>(() =>
      Promise.resolve({ matches: [], hasMore: false }),
    );
    const { ask } = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: aWillingKeeper,
      discovery: { ...DISCOVERY, browse },
    });

    await ask('/api/requests/catalogue/browse?kind=series&list=trending');

    expect(browse).toHaveBeenCalledWith(expect.objectContaining({ filters: {} }));
  });

  it('refuses a genre that is not an id, and a rating past the top of the scale', async () => {
    const { ask } = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: aWillingKeeper,
      discovery: DISCOVERY,
    });

    expect(
      (await ask('/api/requests/catalogue/browse?kind=film&list=popular&genre=action')).status,
    ).toBe(400);
    expect(
      (await ask('/api/requests/catalogue/browse?kind=film&list=popular&minRating=11')).status,
    ).toBe(400);
  });

  it('lists the genres a list can be narrowed to, for films and for series', async () => {
    const { ask } = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: aWillingKeeper,
      discovery: DISCOVERY,
    });

    expect(await (await ask('/api/requests/catalogue/genres?kind=film')).json()).toEqual([
      { id: '28', name: 'Action' },
      { id: '878', name: 'Science Fiction' },
    ]);
    expect(await (await ask('/api/requests/catalogue/genres?kind=series')).json()).toEqual([
      { id: '18', name: 'Drama' },
    ]);
  });

  it('lists the genres only for somebody who may ask for films and series', async () => {
    const music = await build({
      isOn: true,
      granted: ['requests.askMusic'],
      service: aWillingKeeper,
      discovery: DISCOVERY,
    });

    expect((await music.ask('/api/requests/catalogue/genres?kind=film')).status).toBe(403);
  });

  describe('books', () => {
    const PROJECT_HAIL_MARY = {
      openLibraryId: 21_277_329,
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      year: 2021,
      coverUrl: 'https://covers.openlibrary.org/b/id/1-M.jpg',
    };

    const WITH_BOOKS: Discovery = {
      ...DISCOVERY,
      bookShelves: () =>
        Promise.resolve([
          { id: 'trending-books', title: 'Trending books', books: [PROJECT_HAIL_MARY] },
        ]),
      searchBooks: (query) => Promise.resolve(query === 'hail mary' ? [PROJECT_HAIL_MARY] : []),
      describeBook: (openLibraryId) =>
        Promise.resolve(
          openLibraryId === 21_277_329
            ? {
                title: 'Project Hail Mary',
                year: 2021,
                overview: 'A lone astronaut wakes up.',
                posterUrl: null,
                authors: ['Andy Weir'],
                subjects: ['Science fiction'],
              }
            : null,
        ),
    };

    it('asks for a book by its Open Library id, into the books library, as anybody who may ask for films can', async () => {
      const describeBookForRequest = vi.fn(() =>
        Promise.resolve({ ...DUNE, title: 'Project Hail Mary', year: 2021, artist: 'Andy Weir' }),
      );
      const { ask } = await build({
        isOn: true,
        granted: ['requests.ask'],
        service: aWillingKeeper,
        describeBookForRequest,
        libraries: [FILMS, BOOKS],
      });

      sent.length = 0;

      const made = await ask('/api/requests/media', 'POST', {
        kind: 'book',
        openLibraryId: 21_277_329,
      });

      expect(made.status).toBe(201);
      expect(describeBookForRequest).toHaveBeenCalledWith(21_277_329);
      expect(JSON.parse(bodySentTo('/api/requests'))).toMatchObject({
        kind: 'book',
        tmdbId: null,
        musicBrainzId: null,
        openLibraryId: 21_277_329,
        libraryId: BOOKS.id,
        libraryPath: '/media/Books',
        catalogue: { title: 'Project Hail Mary', artist: 'Andy Weir' },
      });
    });

    it('says there is no library of books to put it in, rather than filing it with the films', async () => {
      const { ask } = await build({
        isOn: true,
        granted: ['requests.ask'],
        service: aWillingKeeper,
        describeBookForRequest: () => Promise.resolve(DUNE),
      });

      expect(
        await (await ask('/api/requests/media', 'POST', { kind: 'book', openLibraryId: 1 })).json(),
      ).toEqual({ error: 'There is no library of books to put it in.' });
    });

    it('will not ask for a book by a TMDB id, nor for a film by an Open Library one', async () => {
      const { ask } = await build({
        isOn: true,
        granted: ['requests.ask'],
        service: aWillingKeeper,
        describeBookForRequest: () => Promise.resolve(DUNE),
        describeForRequest: () => Promise.resolve(DUNE),
        libraries: [FILMS, BOOKS],
      });

      expect((await ask('/api/requests/media', 'POST', { kind: 'book', tmdbId: 1 })).status).toBe(
        400,
      );
      expect(
        (await ask('/api/requests/media', 'POST', { kind: 'film', openLibraryId: 1 })).status,
      ).toBe(400);
    });

    it('will not ask for a book where the catalogue does not know it', async () => {
      const { ask } = await build({
        isOn: true,
        granted: ['requests.ask'],
        service: aWillingKeeper,
        libraries: [FILMS, BOOKS],
      });

      expect(
        await (
          await ask('/api/requests/media', 'POST', { kind: 'book', openLibraryId: 99 })
        ).json(),
      ).toEqual({ error: 'The catalogue does not know that, or cannot be asked just now.' });
    });

    it('shelves books for anybody who may ask for films, and for nobody who may not', async () => {
      const viewer = await build({
        isOn: true,
        granted: ['requests.ask'],
        service: aWillingKeeper,
        discovery: WITH_BOOKS,
      });

      const shelves = z
        .object({ shelves: z.array(z.object({ id: z.string() })) })
        .parse(await (await viewer.ask('/api/requests/discover')).json());

      expect(shelves.shelves.map((shelf) => shelf.id)).toContain('trending-books');

      const listener = await build({
        isOn: true,
        granted: ['requests.askMusic'],
        service: aWillingKeeper,
        discovery: WITH_BOOKS,
      });

      const heard = z
        .object({ shelves: z.array(z.object({ id: z.string() })) })
        .parse(await (await listener.ask('/api/requests/discover')).json());

      expect(heard.shelves.map((shelf) => shelf.id)).not.toContain('trending-books');
    });

    it('searches Open Library for a book, each saying where it stands', async () => {
      const { ask } = await build({
        isOn: true,
        granted: ['requests.ask'],
        service: aWillingKeeper,
        discovery: WITH_BOOKS,
      });

      expect(
        await (await ask('/api/requests/catalogue/search?query=hail%20mary&kind=book')).json(),
      ).toMatchObject([
        {
          kind: 'book',
          id: '21277329',
          title: 'Project Hail Mary',
          subtitle: 'Andy Weir',
          standing: { status: 'askable' },
        },
      ]);
    });

    it('describes a book with its authors and subjects', async () => {
      const { ask } = await build({
        isOn: true,
        granted: ['requests.ask'],
        service: aWillingKeeper,
        discovery: WITH_BOOKS,
      });

      expect(await (await ask('/api/requests/catalogue/title/book/21277329')).json()).toMatchObject(
        {
          kind: 'book',
          title: 'Project Hail Mary',
          authors: ['Andy Weir'],
          genres: ['Science fiction'],
        },
      );
      expect((await ask('/api/requests/catalogue/title/book/5')).status).toBe(404);
    });

    it('keeps books from somebody who may only ask for music', async () => {
      const { ask } = await build({
        isOn: true,
        granted: ['requests.askMusic'],
        service: aWillingKeeper,
        discovery: WITH_BOOKS,
      });

      expect((await ask('/api/requests/catalogue/search?query=hail%20mary&kind=book')).status).toBe(
        403,
      );
      expect((await ask('/api/requests/catalogue/title/book/21277329')).status).toBe(403);
    });

    it('lets whoever manages requesting say a request has been met by hand, and nobody else', async () => {
      const manager = await build({
        isOn: true,
        granted: ['requests.manage'],
        service: aWillingKeeper,
      });

      sent.length = 0;

      expect((await manager.ask(`/api/requests/media/${REQUEST.id}/fulfil`, 'POST')).status).toBe(
        200,
      );
      expect(sent[0]).toMatchObject({
        method: 'POST',
        url: `http://requests:8421/api/requests/${REQUEST.id}/fulfil`,
      });

      const asker = await build({
        isOn: true,
        granted: ['requests.ask'],
        service: aWillingKeeper,
      });

      expect((await asker.ask(`/api/requests/media/${REQUEST.id}/fulfil`, 'POST')).status).toBe(
        403,
      );
    });
  });

  it('searches and describes titles to ask for, by what a viewer may ask for', async () => {
    const { ask } = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: aWillingKeeper,
      discovery: DISCOVERY,
    });

    expect(await (await ask('/api/requests/catalogue/title/film/438631')).json()).toMatchObject({
      title: 'Dune',
      genres: ['Science Fiction'],
      standing: { status: 'requested' },
    });
    expect((await ask('/api/requests/catalogue/title/film/2')).status).toBe(404);
    expect((await ask('/api/requests/catalogue/title/artist/deezer-2')).status).toBe(403);
    expect(
      (await ask('/api/requests/catalogue/search?query=pink%20floyd&kind=artist')).status,
    ).toBe(403);
    expect(await (await ask('/api/requests/catalogue/search?query=dune&kind=film')).json()).toEqual(
      [],
    );
  });

  it('says how the downloads a viewer’s own requests wait on are going', async () => {
    const DOWNLOAD = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
    let owner = '';
    const { ask, accountId } = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: (url) =>
        url.endsWith('/api/downloads')
          ? Response.json({
              clients: [],
              checkedAt: null,
              downloads: [
                {
                  id: DOWNLOAD,
                  clientId: '0f8fad5b-d9cb-469f-a165-70867728950e',
                  clientName: 'qBittorrent',
                  protocol: 'torrent',
                  libraryKind: 'movies',
                  title: 'Dune',
                  indexerName: null,
                  state: 'downloading',
                  problem: null,
                  progress: 0.5,
                  sizeBytes: 100,
                  doneBytes: 50,
                  downloadBytesPerSecond: 10,
                  uploadBytesPerSecond: null,
                  secondsLeft: 5,
                  seeds: null,
                  peers: null,
                  sentAt: '2026-09-19T00:00:00.000Z',
                  finishedAt: null,
                },
              ],
            })
          : Response.json([
              {
                ...REQUEST,
                requestedBy: { id: owner, name: 'Me' },
                items: [
                  {
                    id: '1c6a7e2b-3d4f-4a5b-9c8d-7e6f5a4b3c2d',
                    musicBrainzId: null,
                    season: null,
                    episode: null,
                    title: 'Dune',
                    airDate: null,
                    state: 'downloading',
                    problem: null,
                    releaseTitle: 'Dune',
                    downloadId: DOWNLOAD,
                    filePath: null,
                    score: null,
                    downloadedBytes: null,
                    downloadSeconds: null,
                    lastSearchedAt: null,
                    updatedAt: '2026-09-19T00:00:00.000Z',
                  },
                ],
              },
            ]),
    });

    owner = accountId;

    expect(await (await ask('/api/requests/progress')).json()).toEqual([
      {
        downloadId: DOWNLOAD,
        state: 'downloading',
        progress: 0.5,
        sizeBytes: 100,
        doneBytes: 50,
        downloadBytesPerSecond: 10,
        secondsLeft: 5,
      },
    ]);

    owner = 'someone-else';

    expect(await (await ask('/api/requests/progress')).json()).toEqual([]);
  });

  it('lets somebody cancel their own request until it is in the library, with its downloads', async () => {
    let owner = '';
    let state = 'downloading';
    const deleted: string[] = [];
    const { ask, accountId } = await build({
      isOn: true,
      granted: ['requests.ask'],
      service: (url, init) => {
        if (init.method === 'DELETE') {
          deleted.push(url);

          return new Response(null, { status: 204 });
        }

        return Response.json({ ...REQUEST, requestedBy: { id: owner, name: 'Me' }, state });
      },
    });

    owner = accountId;

    expect((await ask(`/api/requests/media/${REQUEST.id}`, 'DELETE')).status).toBe(204);
    expect(deleted[0]).toMatch(/\?deleteDownloads=true$/);

    state = 'available';

    expect(await (await ask(`/api/requests/media/${REQUEST.id}`, 'DELETE')).json()).toEqual({
      error: 'It is in the library already, so there is nothing left to cancel.',
    });

    owner = 'someone-else';
    state = 'wanted';

    expect((await ask(`/api/requests/media/${REQUEST.id}`, 'DELETE')).status).toBe(404);
    expect(deleted).toHaveLength(1);
  });

  it('passes on why the service would not do something', async () => {
    const refusing = await build({
      isOn: true,
      isAdministrator: true,
      service: () =>
        new Response(JSON.stringify({ error: 'The film is on its way already' }), { status: 400 }),
    });

    for (const [method, path, body] of [
      ['GET', '/api/requests/media', undefined],
      ['POST', `/api/requests/media/${REQUEST.id}/approve`, undefined],
      ['POST', `/api/requests/media/${REQUEST.id}/refuse`, { reason: '' }],
    ] as const) {
      expect((await refusing.ask(path, method, body)).status).toBe(400);
    }
  });

  describe('the quality a request is asked at', () => {
    const UHD = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
    const HD = '3f2504e0-4f89-11d3-9a0c-0305e82c3302';

    const asking = async (granted: readonly Permission[] = ['requests.ask']) => {
      const built = await build({
        isOn: true,
        granted,
        service: aWillingKeeper,
        describeForRequest: () => Promise.resolve(DUNE),
        libraries: [FILMS, MUSIC],
      });

      sent.length = 0;

      return built;
    };

    const offered = async (ask: Awaited<ReturnType<typeof build>>['ask'], kind = 'film') => {
      const response = await ask(`/api/requests/profiles?kind=${kind}`);

      expect(response.status).toBe(200);

      return ProfilesOnOfferSchema.parse(await response.json());
    };

    beforeEach(() => {
      PROFILES.length = 0;
    });

    it('offers the profiles that are nobody’s in particular', async () => {
      PROFILES.push(aProfile(HD, 'HD'), aProfile(UHD, '4K'));

      const { ask } = await asking();

      expect(await offered(ask)).toEqual({
        choices: [
          { id: HD, name: 'HD', kind: 'video' },
          { id: UHD, name: '4K', kind: 'video' },
        ],
        forcedId: null,
      });
    });

    it('offers only profiles of the kind asked about', async () => {
      PROFILES.push(aProfile(HD, 'HD'), aProfile(UHD, 'Lossless', { kind: 'music' }));

      const { ask } = await asking(['requests.ask', 'requests.askMusic']);

      expect((await offered(ask, 'artist')).choices).toEqual([
        { id: UHD, name: 'Lossless', kind: 'music' },
      ]);
    });

    it('keeps a profile locked to a role away from somebody who does not hold it', async () => {
      PROFILES.push(aProfile(HD, 'HD'), aProfile(UHD, '4K', { roleIds: ['some-other-role'] }));

      const { ask } = await asking();

      expect((await offered(ask)).choices).toEqual([{ id: HD, name: 'HD', kind: 'video' }]);
    });

    it('offers a locked profile to somebody whose role is named on it', async () => {
      const { ask, roleId } = await asking();

      PROFILES.push(aProfile(UHD, '4K', { roleIds: [roleId ?? ''] }));

      expect((await offered(ask)).choices).toEqual([{ id: UHD, name: '4K', kind: 'video' }]);
    });

    it('offers a locked profile to an account named on it', async () => {
      const { ask, accountId } = await asking();

      PROFILES.push(aProfile(UHD, '4K', { accountIds: [accountId] }));

      expect((await offered(ask)).choices).toEqual([{ id: UHD, name: '4K', kind: 'video' }]);
    });

    it('offers only the default once one is set, and says it is forced', async () => {
      const { ask, accountId } = await asking();

      PROFILES.push(
        aProfile(HD, 'HD', { isDefault: true }),
        aProfile(UHD, '4K', { accountIds: [accountId] }),
      );

      expect(await offered(ask)).toEqual({
        choices: [{ id: HD, name: 'HD', kind: 'video' }],
        forcedId: HD,
      });
    });

    it('asks at the quality chosen, where it is theirs to choose', async () => {
      PROFILES.push(aProfile(HD, 'HD'));

      const { ask } = await asking();

      expect(
        (await ask('/api/requests/media', 'POST', { kind: 'film', tmdbId: 438631, profileId: HD }))
          .status,
      ).toBe(201);
      expect(JSON.parse(bodySentTo('/api/requests'))).toMatchObject({ profileId: HD });
    });

    it('refuses a quality that is not theirs to ask for, without asking for anything', async () => {
      PROFILES.push(aProfile(HD, 'HD'), aProfile(UHD, '4K', { roleIds: ['some-other-role'] }));

      const { ask } = await asking();
      const refused = await ask('/api/requests/media', 'POST', {
        kind: 'film',
        tmdbId: 438631,
        profileId: UHD,
      });

      expect(refused.status).toBe(403);
      expect(await refused.json()).toEqual({ error: 'That quality is not available to you.' });
      expect(sent.some(({ url }) => url.endsWith('/api/requests'))).toBe(false);
    });

    it('takes every request through the default, and refuses anybody asking past it', async () => {
      PROFILES.push(aProfile(HD, 'HD', { isDefault: true }), aProfile(UHD, '4K'));

      const { ask } = await asking();

      expect(
        (await ask('/api/requests/media', 'POST', { kind: 'film', tmdbId: 438631 })).status,
      ).toBe(201);
      expect(JSON.parse(bodySentTo('/api/requests'))).toMatchObject({ profileId: HD });

      const refused = await ask('/api/requests/media', 'POST', {
        kind: 'film',
        tmdbId: 438631,
        profileId: UHD,
      });

      expect(refused.status).toBe(403);
    });

    it('neither gates nor forces whoever manages requesting', async () => {
      PROFILES.push(
        aProfile(HD, 'HD', { isDefault: true }),
        aProfile(UHD, '4K', { roleIds: ['some-other-role'] }),
      );

      const { ask } = await asking(['requests.manage', 'requests.ask']);

      expect(await offered(ask)).toEqual({
        choices: [
          { id: HD, name: 'HD', kind: 'video' },
          { id: UHD, name: '4K', kind: 'video' },
        ],
        forcedId: null,
      });
      expect(
        (await ask('/api/requests/media', 'POST', { kind: 'film', tmdbId: 438631, profileId: UHD }))
          .status,
      ).toBe(201);
      expect(JSON.parse(bodySentTo('/api/requests'))).toMatchObject({ profileId: UHD });
    });

    it('offers a profile written for one library only where that library is asked about', async () => {
      const SHOWS = {
        ...FILMS,
        id: '2b7c9e1d-4f6a-4c8b-9d0e-1f2a3b4c5d6e',
        name: 'Shows',
        kind: 'shows' as const,
        path: '/media/Shows',
      };

      PROFILES.push(
        aProfile(HD, 'Films only', { libraryIds: [FILMS.id] }),
        aProfile(UHD, 'Shows only', { libraryIds: [SHOWS.id] }),
      );

      const built = await build({
        isOn: true,
        granted: ['requests.ask'],
        service: aWillingKeeper,
        describeForRequest: () => Promise.resolve(DUNE),
        libraries: [FILMS, SHOWS],
      });

      expect((await offered(built.ask, 'film')).choices.map((one) => one.name)).toEqual([
        'Films only',
      ]);
      expect((await offered(built.ask, 'series')).choices.map((one) => one.name)).toEqual([
        'Shows only',
      ]);
    });

    it('offers a profile naming no library whatever is being asked for', async () => {
      PROFILES.push(aProfile(HD, 'Anything'));

      const { ask } = await asking();

      expect((await offered(ask, 'film')).choices.map((one) => one.name)).toEqual(['Anything']);
      expect((await offered(ask, 'series')).choices.map((one) => one.name)).toEqual(['Anything']);
    });

    it('refuses to say what is on offer to somebody who may not ask at all', async () => {
      const { ask } = await build({ isOn: true, granted: [], service: aWillingKeeper });

      expect((await ask('/api/requests/profiles?kind=film')).status).toBe(403);
    });
  });
});
