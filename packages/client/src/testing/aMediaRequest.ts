import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * An approved request for Dune, still wanted, with anything a test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The request, as the server shows it.
 */
const aMediaRequest = (overrides: Partial<MediaRequest> = {}): MediaRequest => ({
  id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  kind: 'film',
  tmdbId: 438631,
  musicBrainzId: null,
  openLibraryId: null,
  title: 'Dune',
  artistName: null,
  year: 2021,
  overview: null,
  posterUrl: null,
  libraryId: 'films',
  profileId: null,
  profileName: null,
  isPickedByHand: false,
  state: 'wanted',
  problem: null,
  problemCode: null,
  approval: 'approved',
  refusedBecause: null,
  requestedBy: { id: 'someone', name: 'Sam' },
  seasons: null,
  releaseTypes: null,
  releaseDate: '2021-12-03',
  items: [],
  mediaId: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

export { aMediaRequest };
