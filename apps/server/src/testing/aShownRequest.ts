import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import { aShownRequestItem } from '@ValenceServer/testing/aShownRequestItem';

/**
 * An approved request for Dune waiting on the film, with anything the test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The request, as the requests service shows it.
 */
const aShownRequest = (overrides: Partial<MediaRequest> = {}): MediaRequest => ({
  id: crypto.randomUUID(),
  kind: 'film',
  tmdbId: 438_631,
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
  followsNewSeasons: false,
  releaseTypes: null,
  releaseDate: null,
  releaseDates: { theatrical: null, digital: null, physical: null },
  items: [aShownRequestItem({})],
  mediaId: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

export { aShownRequest };
