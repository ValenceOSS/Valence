import { describe, expect, it } from 'vitest';
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
import { AboutSchema } from '@ValenceContracts/schemas/About';
import { SERVER_FEATURES } from '@ValenceContracts/constants/SERVER_FEATURES';

/**
 * A server started as an image starts it: told which release and which commit it is.
 *
 * @param commit - The commit it was built from, where it was told one.
 * @param isSignedIn - Whether whoever asks is signed in.
 * @returns What it says about itself.
 */
const askAbout = async (commit?: string, isSignedIn = true) => {
  const { auth, settings } = createMemoryAuth();
  const app = createApp({
    auth,
    settings,
    version: '1.2.0',
    commit,
    permissions: createMemoryPermissionService(),
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
  const answer = await app.request(
    `${TEST_ORIGIN}/api/about`,
    isSignedIn ? { headers: { cookie } } : {},
  );

  return AboutSchema.parse(await answer.json());
};

describe('GET /api/about', () => {
  it('says the release and the commit an image was built from, shortened', async () => {
    await expect(askAbout('e68dd3525b1a2c3d4e5f60718293a4b5c6d7e8f9')).resolves.toEqual({
      version: '1.2.0',
      commit: 'e68dd35',
      features: [...SERVER_FEATURES],
    });
  });

  it('lists what this server can do, so a newer app can tell what it may ask for', async () => {
    const about = await askAbout();

    expect(about.features).toContain('server.reportsFeatures');
  });

  it('reads the commit off the checkout where it was not told one', async () => {
    const about = await askAbout();

    expect(about.version).toBe('1.2.0');
    expect(about.commit).toMatch(/^([0-9a-f]{7,}|unknown)$/);
  });

  it('keeps its release and commit from somebody not signed in, and still says what it can do', async () => {
    const about = await askAbout('e68dd3525b1a2c3d4e5f60718293a4b5c6d7e8f9', false);

    expect(about.version).toBeUndefined();
    expect(about.commit).toBeUndefined();
    expect(about.features).toContain('server.reportsFeatures');
  });
});
