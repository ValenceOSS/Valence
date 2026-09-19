import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * An approved request for Dune in a films library, with anything a test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The request as kept.
 */
const aMediaRequest = (overrides: Partial<MediaRequestRecord> = {}): MediaRequestRecord => ({
  id: '9b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  kind: 'film',
  tmdbId: 438631,
  title: 'Dune',
  year: 2021,
  aliases: [],
  overview: null,
  posterUrl: null,
  libraryId: 'films',
  libraryPath: '/media/Films',
  profileId: null,
  approval: 'approved',
  refusedBecause: null,
  requestedById: 'someone',
  requestedByName: 'Someone',
  seasons: null,
  waitFor: 'digital',
  runtimeMinutes: 155,
  releaseDates: { theatrical: '2021-10-22', digital: '2021-12-03', physical: '2022-01-11' },
  isEnded: false,
  mediaId: null,
  problem: null,
  catalogueCheckedAt: '2026-09-19T00:00:00.000Z',
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

export { aMediaRequest };
