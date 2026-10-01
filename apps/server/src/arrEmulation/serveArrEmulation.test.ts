import { describe, expect, it } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { SEERR_KEY } from './testing/anArrEmulation';

/**
 * The whole server, answering Overseerr and Jellyseerr with the key given, but with no requesting.
 */
const build = async () => {
  const { auth, settings } = createMemoryAuth();

  await settings.write({ seerr: { isEnabled: true, apiKey: SEERR_KEY, accountId: '' } });

  return createApp({
    auth,
    settings,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({ libraries: [], media: [] }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });
};

describe('serveArrEmulation', () => {
  it('stands in for Radarr and for Sonarr under their own bases', async () => {
    const app = await build();

    for (const base of ['/arr/radarr', '/arr/sonarr']) {
      const response = await app.request(`http://valence${base}/api/v3/system/status`, {
        headers: { 'X-Api-Key': SEERR_KEY },
      });

      expect(response.status).toBe(503);
    }
  });

  it('keeps setting it up to whoever manages requesting', async () => {
    const app = await build();

    expect((await app.request('http://localhost:8420/api/requests/seerr')).status).toBe(401);
  });
});
