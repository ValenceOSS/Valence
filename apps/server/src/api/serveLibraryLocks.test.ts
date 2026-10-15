import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { makeAdministrator, signUpForTest, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';

const LIBRARY_ID = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';

const FILM: MediaDetail = {
  id: '9c858901-8a57-4791-81fe-4c455b099bc9',
  libraryId: LIBRARY_ID,
  title: 'Arrival',
  year: 2016,
  container: 'mkv',
  durationSeconds: 7200,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 1920,
  height: 1080,
  bitrateKbps: 8000,
  audioStreams: [],
  subtitleStreams: [],
  addedAt: '2026-08-10T00:00:00.000Z',
  metadata: { hasPoster: false, hasBackdrop: false, hasLogo: false },
};

const PageSchema = z.object({ total: z.number() });

const LibrariesSchema = z.array(
  z.object({ id: z.string(), hasLock: z.boolean(), isLocked: z.boolean() }),
);

const build = async () => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const profiles = createMemoryProfileService();

  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({
      libraries: [
        {
          id: LIBRARY_ID,
          name: 'Late night',
          kind: 'movies',
          path: '/media/late',
          itemCount: 1,
          lastScannedAt: null,
          defaultAudioLanguage: null,
          filesAtOnce: null,
          takesRequests: true,
          requestProfileId: null,
          requestPath: null,
          keepsShowsTogether: true,
          higherProfileAsks: 'ask',
        },
      ],
      media: [FILM],
    }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    realtime: { publish: vi.fn(), recheck: vi.fn(), recheckAll: vi.fn() },
    unlockSecret: 'test-secret',
    profiles,
  });

  const session = await signUpForTest(app);
  const account = store.user[0];

  if (account !== undefined) {
    account.role = 'admin';
    await makeAdministrator(permissions, account.id);
  }

  const ask = (path: string, init: RequestInit = {}, unlocked = '') =>
    app.request(`${TEST_ORIGIN}${path}`, {
      ...init,
      headers: {
        origin: TEST_ORIGIN,
        'content-type': 'application/json',
        cookie: unlocked === '' ? session : `${session}; ${unlocked}`,
      },
    });

  return { ask, profiles, accountId: account?.id ?? '' };
};

const lock = (ask: Awaited<ReturnType<typeof build>>['ask']) =>
  ask(`/api/admin/libraries/${LIBRARY_ID}/lock`, {
    method: 'PUT',
    body: JSON.stringify({ secret: '2468', relockMinutes: 30 }),
  });

const unlock = (ask: Awaited<ReturnType<typeof build>>['ask'], secret: string) =>
  ask(`/api/libraries/${LIBRARY_ID}/unlock`, {
    method: 'POST',
    body: JSON.stringify({ secret }),
  });

const titlesIn = async (ask: Awaited<ReturnType<typeof build>>['ask'], unlocked = '') =>
  PageSchema.parse(await (await ask(`/api/libraries/${LIBRARY_ID}/items`, {}, unlocked)).json())
    .total;

describe('a locked library', () => {
  it('hides its titles, but is still listed as locked so it can be opened', async () => {
    const { ask } = await build();

    expect(await titlesIn(ask)).toBe(1);

    await lock(ask);

    expect(await titlesIn(ask)).toBe(0);
    expect(LibrariesSchema.parse(await (await ask('/api/libraries')).json())).toEqual([
      { id: LIBRARY_ID, hasLock: true, isLocked: true },
    ]);
  });

  it('shows its titles once unlocked with the right secret, carried by the cookie it sets', async () => {
    const { ask } = await build();

    await lock(ask);

    const opened = await unlock(ask, '2468');
    const unlocked = opened.headers.getSetCookie()[0]?.split(';')[0] ?? '';

    expect(opened.status).toBe(200);
    expect(await titlesIn(ask, unlocked)).toBe(1);
  });

  it('refuses the wrong secret, and stops listening after five', async () => {
    const { ask } = await build();

    await lock(ask);

    for (let tried = 0; tried < 5; tried += 1) {
      expect((await unlock(ask, '0000')).status).toBe(403);
    }

    expect((await unlock(ask, '2468')).status).toBe(429);
  });

  it('counts tries against the account, so changing profile gives no more', async () => {
    const { ask, profiles, accountId } = await build();

    await lock(ask);

    const kid = await profiles.create(accountId, { name: 'Kid', colour: '#3ac47d' });

    for (let tried = 0; tried < 3; tried += 1) {
      expect((await unlock(ask, '0000')).status).toBe(403);
    }

    expect(
      (await ask(`/api/profiles/${kid.id}/choose`, { method: 'POST', body: '{}' })).status,
    ).toBe(200);

    for (let tried = 0; tried < 2; tried += 1) {
      expect((await unlock(ask, '0000')).status).toBe(403);
    }

    expect((await unlock(ask, '2468')).status).toBe(429);
  });

  it('refuses a cookie somebody wrote by hand', async () => {
    const { ask } = await build();

    await lock(ask);

    expect(await titlesIn(ask, `valence_unlocked=${LIBRARY_ID}.9999999999999.forged`)).toBe(0);
  });

  it('stops hiding anything once the lock is taken away', async () => {
    const { ask } = await build();

    await lock(ask);
    await ask(`/api/admin/libraries/${LIBRARY_ID}/lock`, {
      method: 'PUT',
      body: JSON.stringify({ secret: null }),
    });

    expect(await titlesIn(ask)).toBe(1);
  });
});
