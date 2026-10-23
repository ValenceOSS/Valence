import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { signedInApp, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';

const LimitSchema = z.object({
  maxBitrateKbps: z.number().nullable(),
  maxStreams: z.number().nullable(),
});

const AccountLimitSchema = z.object({
  own: LimitSchema,
  effective: LimitSchema,
  streamsNow: z.number(),
});

const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();

  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    realtime: { publish: vi.fn(), recheck: vi.fn(), recheckAll: vi.fn() },
  });

  return {
    permissions,
    administrator: signedInApp(app, { auth, store, permissions, isAdministrator: true }),
    viewer: signedInApp(app, { auth, store, permissions }),
  };
};

const put = (body: object) => ({
  method: 'PUT',
  headers: { 'content-type': 'application/json', origin: TEST_ORIGIN },
  body: JSON.stringify(body),
});

describe('stream limits', () => {
  it('leaves an account nobody limited free', async () => {
    const { administrator } = build();

    const read = await administrator.request(
      `${TEST_ORIGIN}/api/admin/accounts/someone/stream-limit`,
    );

    expect(AccountLimitSchema.parse(await read.json())).toEqual({
      own: { maxBitrateKbps: null, maxStreams: null },
      effective: { maxBitrateKbps: null, maxStreams: null },
      streamsNow: 0,
    });
  });

  it('holds an account to the limit set for it', async () => {
    const { administrator } = build();

    const set = await administrator.request(
      `${TEST_ORIGIN}/api/admin/accounts/someone/stream-limit`,
      put({ maxBitrateKbps: 8000, maxStreams: 2 }),
    );

    expect(AccountLimitSchema.parse(await set.json()).effective).toEqual({
      maxBitrateKbps: 8000,
      maxStreams: 2,
    });
  });

  it('holds an account to the stricter of its own limit and its roles’', async () => {
    const { administrator, permissions } = build();
    const role = await permissions.createRole({
      name: 'Kids',
      position: 50,
      color: null,
      permissions: [],
    });

    permissions.state.assignments.someone = [role.id];

    await administrator.request(
      `${TEST_ORIGIN}/api/admin/roles/${role.id}/stream-limit`,
      put({ maxBitrateKbps: 4000, maxStreams: null }),
    );

    const set = await administrator.request(
      `${TEST_ORIGIN}/api/admin/accounts/someone/stream-limit`,
      put({ maxBitrateKbps: 8000, maxStreams: 2 }),
    );

    expect(AccountLimitSchema.parse(await set.json())).toMatchObject({
      own: { maxBitrateKbps: 8000, maxStreams: 2 },
      effective: { maxBitrateKbps: 4000, maxStreams: 2 },
    });
  });

  it('refuses a ceiling nothing could be played under', async () => {
    const { administrator } = build();

    const refused = await administrator.request(
      `${TEST_ORIGIN}/api/admin/accounts/someone/stream-limit`,
      put({ maxBitrateKbps: 1, maxStreams: null }),
    );

    expect(refused.status).toBe(400);
  });

  it('is for whoever manages accounts', async () => {
    const { viewer } = build();

    const refused = await viewer.request(
      `${TEST_ORIGIN}/api/admin/accounts/someone/stream-limit`,
      put({ maxBitrateKbps: 8000, maxStreams: null }),
    );

    expect(refused.status).toBe(403);
  });
});
