import { ShowDetailSchema } from '@ValenceContracts/schemas/Show';
import { aJellyfinEpisode } from '@ValenceServer/jellyfin/testing/aJellyfinEpisode';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';

/**
 * A programme with two seasons, as Valence describes it, with whatever a test cares about changed.
 *
 * @param change - What differs.
 * @returns The programme.
 */
const aJellyfinShow = (change: Partial<ShowDetail> = {}): ShowDetail =>
  ShowDetailSchema.parse({
    id: 'twin-peaks',
    libraryId: '9b2d6e3a-1f4c-4e7a-9d3b-5c8e2f1a0b7d',
    title: 'Twin Peaks',
    seasonCount: 2,
    episodeCount: 2,
    latestAddedAt: '2026-11-02T00:00:00.000Z',
    coverMediaId: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
    artwork: { poster: 'http://valence.test/api/artwork/cccccccccccccccccccccccccccccccc' },
    year: 1990,
    unwatchedCount: 2,
    seasons: [
      { seasonNumber: 1, episodes: [aJellyfinEpisode()] },
      {
        seasonNumber: 2,
        episodes: [
          aJellyfinEpisode({
            id: '6ba7b811-9dad-41d1-80b4-00c04fd430c8',
            title: 'May the Giant Be with You',
            seasonNumber: 2,
          }),
        ],
      },
    ],
    ...change,
  });

export { aJellyfinShow };
