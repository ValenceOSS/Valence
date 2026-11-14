import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * A film in a library, as Valence summarises it, with whatever a test cares about changed.
 *
 * @param change - What differs.
 * @returns The film.
 */
const aJellyfinFilm = (change: Partial<MediaSummary> = {}): MediaSummary =>
  MediaSummarySchema.parse({
    id: '0f8fad5b-d9cb-469f-a165-70867728950e',
    libraryId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    title: 'Sneakers',
    year: 1992,
    durationSeconds: 7560,
    width: 1920,
    height: 1080,
    videoCodec: 'h264',
    videoRange: 'SDR',
    addedAt: '2026-11-01T00:00:00.000Z',
    hasPoster: true,
    artwork: {
      poster: 'http://valence.test/api/artwork/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      backdrop: 'http://valence.test/api/artwork/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    },
    ...change,
  });

export { aJellyfinFilm };
