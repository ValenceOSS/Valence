import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signUpForTest, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { jobDefinitionsFor } from '@ValenceServer/jobs/jobDefinitions';

const build = async (found: boolean) => {
  const { auth, settings } = createMemoryAuth();
  const readImage = vi.fn((url: string) =>
    Promise.resolve(
      found && url.length > 0
        ? { body: new TextEncoder().encode('picture').buffer, contentType: 'image/jpeg' }
        : null,
    ),
  );

  const app = createApp({
    auth,
    settings,
    permissions: createMemoryPermissionService(),
    requests: null,
    requestsClient: null,
    jobDefinitions: jobDefinitionsFor(false),
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({ libraries: [], media: [] }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    readImage,
  });

  return { app, cookie: await signUpForTest(app), readImage };
};

describe('GET /api/catalogue/pictures/{size}/{file}', () => {
  it('serves a catalogue picture through the store the library keeps its artwork in', async () => {
    const { app, cookie, readImage } = await build(true);
    const response = await app.request(`${TEST_ORIGIN}/api/catalogue/pictures/w780/still.jpg`, {
      headers: { cookie, origin: TEST_ORIGIN },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(readImage).toHaveBeenCalledWith('https://image.tmdb.org/t/p/w780/still.jpg');
  });

  it('says so where the picture could not be fetched', async () => {
    const { app, cookie } = await build(false);
    const response = await app.request(`${TEST_ORIGIN}/api/catalogue/pictures/w780/still.jpg`, {
      headers: { cookie, origin: TEST_ORIGIN },
    });

    expect(response.status).toBe(404);
  });

  it('fetches nothing but a picture of the catalogue’s own', async () => {
    const { app, cookie, readImage } = await build(true);
    const response = await app.request(
      `${TEST_ORIGIN}/api/catalogue/pictures/w780/..%2F..%2Fsecret`,
      { headers: { cookie, origin: TEST_ORIGIN } },
    );

    expect(response.status).toBe(400);
    expect(readImage).not.toHaveBeenCalled();
  });

  it('turns away somebody not signed in', async () => {
    const { app } = await build(true);
    const response = await app.request(`${TEST_ORIGIN}/api/catalogue/pictures/w780/still.jpg`);

    expect(response.status).toBe(401);
  });
});
