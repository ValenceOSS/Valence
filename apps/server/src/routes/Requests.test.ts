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
};

/**
 * A server with requesting on or off, and somebody signed in holding what is asked for.
 */
const build = async ({
  isOn,
  granted = [],
  isAdministrator = false,
}: {
  isOn: boolean;
  granted?: readonly Permission[];
  isAdministrator?: boolean;
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

  const ask = (path: string, method = 'GET') =>
    app.request(`${TEST_ORIGIN}${path}`, { method, headers: { cookie, origin: TEST_ORIGIN } });

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
