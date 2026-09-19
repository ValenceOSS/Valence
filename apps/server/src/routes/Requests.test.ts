import { describe, expect, it, vi } from 'vitest';
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

const A_TEST = { isWorking: true, problem: null, capabilities: null };

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

const build = async ({
  isOn,
  granted = [],
  isAdministrator = false,
  service = aWillingService,
}: {
  isOn: boolean;
  granted?: readonly Permission[];
  isAdministrator?: boolean;
  service?: (url: string, init: { method?: string }) => Response;
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
    library: createMemoryLibraryService(),
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

  return { app, ask, readStatus };
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
