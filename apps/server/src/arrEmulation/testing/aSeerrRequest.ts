import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * A request for a film or a series as the requests service shows one, approved and waiting to be
 * found unless told otherwise.
 *
 * @param change - What is different about this one.
 * @returns The request.
 */
const aSeerrRequest = (change: Partial<MediaRequest> = {}): MediaRequest => ({
  id: '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b',
  kind: 'film',
  tmdbId: 329865,
  musicBrainzId: null,
  openLibraryId: null,
  title: 'Arrival',
  artistName: null,
  year: 2016,
  overview: 'Linguist meets visitors.',
  posterUrl: 'https://image.tmdb.org/t/p/w342/arrival.jpg',
  libraryId: '9b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  profileId: null,
  profileName: null,
  isPickedByHand: false,
  state: 'wanted',
  problem: null,
  problemCode: null,
  approval: 'approved',
  refusedBecause: null,
  requestedBy: { id: 'seerr-account', name: 'Requests from Seerr' },
  alsoAskedBy: [],
  origin: 'asked',
  isFollowed: false,
  profileAsk: null,
  seasons: null,
  followsNewSeasons: false,
  releaseTypes: null,
  releaseDate: null,
  releaseDates: { theatrical: null, digital: null, physical: null },
  items: [],
  mediaId: null,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...change,
});

export { aSeerrRequest };
