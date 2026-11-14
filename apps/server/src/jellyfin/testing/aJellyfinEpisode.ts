import { aJellyfinFilm } from '@ValenceServer/jellyfin/testing/aJellyfinFilm';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * An episode of a programme in a library, as Valence summarises it, with whatever a test cares
 * about changed.
 *
 * @param change - What differs.
 * @returns The episode.
 */
const aJellyfinEpisode = (change: Partial<MediaSummary> = {}): MediaSummary =>
  aJellyfinFilm({
    id: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
    libraryId: '9b2d6e3a-1f4c-4e7a-9d3b-5c8e2f1a0b7d',
    title: 'Pilot',
    seriesTitle: 'Twin Peaks',
    seriesId: null,
    seasonNumber: 1,
    episodeNumber: 1,
    artwork: {
      poster: 'http://valence.test/api/artwork/cccccccccccccccccccccccccccccccc',
      backdrop: 'http://valence.test/api/artwork/dddddddddddddddddddddddddddddddd',
      titleBackdrop: 'http://valence.test/api/artwork/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    },
    ...change,
  });

export { aJellyfinEpisode };
