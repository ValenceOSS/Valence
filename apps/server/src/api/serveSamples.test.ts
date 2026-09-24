import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signedInApp } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';

const BASE = 'http://localhost:8420';

const PREVIEW = 'https://audio-ssl.itunes.apple.com/itunes-assets/preview.m4a';

/**
 * The app, signed in as somebody who may or may not administer it.
 *
 * @param isAdministrator - Whether they hold every permission.
 * @returns The app.
 */
const build = (isAdministrator: boolean) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({ libraries: [], media: [] }),
    subtitles: createMemorySubtitleService(),
    segments: createMemorySegmentService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    playback: createMemoryPlaybackService(),
  });

  return signedInApp(app, { store, permissions, isAdministrator });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('finding a sample over HTTP', () => {
  it('finds a sample for somebody who may ask for music, and asks Apple once for the same album', async () => {
    const answered = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            results: [{ artistName: 'Drake', collectionName: 'Her Loss', previewUrl: PREVIEW }],
          }),
        ),
      ),
    );
    const app = build(true);

    vi.stubGlobal('fetch', answered);

    const asking = `${BASE}/api/requests/sample?${new URLSearchParams({ artist: 'Drake', album: 'Her Loss' }).toString()}`;
    const first = await app.request(asking);

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ url: PREVIEW });

    await app.request(asking);

    expect(answered).toHaveBeenCalledTimes(1);
  });

  it('finds nothing for somebody who may not ask for music', async () => {
    const app = build(false);
    const answer = await app.request(`${BASE}/api/requests/sample?artist=Drake&album=Views`);

    expect(answer.status).toBe(403);
  });
});
