import { describe, expect, it, vi } from 'vitest';
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
  RequestsOverviewSchema,
} from '@ValenceContracts/schemas/Requests';
import type { RequestsStatus } from '@ValenceContracts/schemas/Requests';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { MediaRequestKind, RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';
import type { EventBus } from '@ValenceServer/events/EventBus';

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
};

const build = async ({
  isOn,
  granted = [],
  isAdministrator = false,
  service = aWillingService,
  events,
  describeForRequest,
}: {
  isOn: boolean;
  granted?: readonly Permission[];
  isAdministrator?: boolean;
  service?: (url: string, init: { method?: string; body?: string }) => Response;
  events?: EventBus;
  describeForRequest?: (tmdbId: number, kind: MediaRequestKind) => Promise<RequestCatalogue | null>;
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
    library: createMemoryLibraryService({ libraries: [FILMS], media: [] }),
    ...(events === undefined ? {} : { events }),
    ...(describeForRequest === undefined ? {} : { describeForRequest }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });

  const cookie = await signUpForTest(app);
  const accountId = store.user[0]?.id ?? '';

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

  return { app, ask, readStatus, accountId };
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

  it('files a download into a library of films or series, and no other', async () => {
    const libraries: Array<{ id: string; path: string }> = [];
    const { ask } = await build({
      isOn: true,
      isAdministrator: true,
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
    expect(libraries).toEqual([{ id: FILMS.id, path: '/media/Films' }]);
    expect(
      await (
        await ask(`/api/admin/requests/downloads/${DOWNLOAD.id}/file`, 'POST', {
          libraryId: 'elsewhere',
        })
      ).json(),
    ).toEqual({ error: 'That is not a library of films or series.' });
  });

  it('sends a film or series for the library it will be filed into, and anything else for none', async () => {
    const libraries: Array<{ id: string; path: string } | null> = [];
    const { ask } = await build({
      isOn: true,
      isAdministrator: true,
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

    expect(libraries).toEqual([{ id: FILMS.id, path: '/media/Films' }, null, null, null]);
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
    upgradeUntilResolution: null,
    upgradeUntilSource: null,
    upgradeUntilMusicQuality: null,
    libraryIds: [],
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
    title: 'Dune',
    year: 2021,
    overview: null,
    posterUrl: null,
    libraryId: FILMS.id,
    profileId: null,
    state: 'wanted',
    problem: null,
    approval: 'approved',
    refusedBecause: 'No room',
    requestedBy: { id: 'someone-else', name: 'Someone' },
    seasons: null,
    waitFor: 'digital',
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
  };

  const sent: Array<{ method: string; url: string; body: string | undefined }> = [];

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
    expect(JSON.parse(sent[0]?.body ?? '{}')).toMatchObject({
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
      (await ask(`/api/requests/media/${REQUEST.id}`, 'PATCH', { waitFor: 'physical' })).status,
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
    expect(
      (await ask(`/api/requests/media/${REQUEST.id}/pick`, 'POST', { release: RELEASE })).status,
    ).toBe(200);
    expect((await ask(`/api/requests/media/${REQUEST.id}`, 'DELETE')).status).toBe(204);
    expect(await (await ask('/api/requests/media/missing', 'POST')).json()).toEqual({
      searched: 1,
      startedAt: '2026-09-19T00:00:00.000Z',
    });
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
});
