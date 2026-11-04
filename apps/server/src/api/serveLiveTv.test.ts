import { describe, expect, it, vi } from 'vitest';
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
import { createIptvOrgCatalogue } from '@ValenceServer/live/createIptvOrgCatalogue';
import { createLiveRelay } from '@ValenceServer/live/createLiveRelay';
import { createLiveRoutes } from '@ValenceServer/live/createLiveRoutes';
import { createLiveTvService } from '@ValenceServer/live/createLiveTvService';
import { aLiveTvStore } from '@ValenceServer/testing/aLiveTvStore';
import { aStoredLiveSource } from '@ValenceServer/testing/aStoredLiveSource';

const SOURCE = aStoredLiveSource();

const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const held = aLiveTvStore(SOURCE);
  const routes = createLiveRoutes('');

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
    liveTv: {
      service: createLiveTvService({ store: held.store, routes, fetcher: vi.fn() }),
      relay: createLiveRelay(),
      iptvOrg: createIptvOrgCatalogue(Date.now, vi.fn()),
      routes,
    },
  });

  return {
    held,
    administrator: signedInApp(app, { auth, store, permissions, isAdministrator: true }),
    viewer: signedInApp(app, { auth, store, permissions }),
  };
};

const patch = (body: object) => ({
  method: 'PATCH',
  headers: { 'content-type': 'application/json', origin: TEST_ORIGIN },
  body: JSON.stringify(body),
});

describe('changing a live TV source', () => {
  it('renames it for an administrator', async () => {
    const { administrator, held } = build();
    const answer = await administrator.request(
      `${TEST_ORIGIN}/api/live/sources/${SOURCE.id}`,
      patch({ name: 'World news' }),
    );

    expect(answer.status).toBe(200);
    expect(await answer.json()).toMatchObject({ id: SOURCE.id, name: 'World news' });
    expect(held.changes[0]).toEqual({ name: 'World news' });
  });

  it('refuses an address it cannot read, with its code', async () => {
    const { administrator } = build();
    const answer = await administrator.request(
      `${TEST_ORIGIN}/api/live/sources/${SOURCE.id}`,
      patch({ address: 'not an address' }),
    );

    expect(answer.status).toBe(400);
    expect(await answer.json()).toMatchObject({ code: 'error.live.thatAddressCannotBeRead' });
  });

  it('says there is no such source', async () => {
    const { administrator } = build();
    const answer = await administrator.request(
      `${TEST_ORIGIN}/api/live/sources/6b1f0000-0000-4000-8000-000000000009`,
      patch({ name: 'Gone' }),
    );

    expect(answer.status).toBe(404);
  });

  it('is only for administrators', async () => {
    const { viewer, held } = build();
    const answer = await viewer.request(
      `${TEST_ORIGIN}/api/live/sources/${SOURCE.id}`,
      patch({ name: 'World news' }),
    );

    expect(answer.status).toBe(403);
    expect(held.changes).toEqual([]);
  });
});
